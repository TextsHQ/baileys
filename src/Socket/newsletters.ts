import { SocketConfig } from '../Types'
import { GraphQLResponse, NewsletterMetadata } from '../Types/Newsletter'
import { convertKeysToCamelCase, getBinaryNodeChildBuffer, S_WHATSAPP_NET } from '..'
import { makeRegistrationSocket } from './registration'

export function makeNewslettersSocket(config: SocketConfig) {
	const sock = makeRegistrationSocket(config)
	const { query } = sock

	const mexQuery = async(queryId: string, variables = {}) => {
		const response = await query({
			tag: 'iq',
			attrs: {
				type: 'get',
				xmlns: 'w:mex',
				to: S_WHATSAPP_NET
			},
			content: [ { tag: 'query', attrs: { 'query_id': queryId }, content: JSON.stringify({ variables }) } ]
		})

		const result = getBinaryNodeChildBuffer(response, 'result')

		if(!result) {
			throw new Error('Missing "result" element in response')
		}

		const gqlResp: GraphQLResponse = JSON.parse(result.toString())

		if(gqlResp.errors?.length > 0) {
			throw new Error('Graphql Error when fetching newsletters')
		}

		return gqlResp.data
	}

	// const queryFetchNewsletter = '6563316087068696'
	// const queryFetchNewsletterDehydrated = '7272540469429201'
	// const queryRecommendedNewsletters = '7263823273662354' // variables -> input -> {limit: 20, country_codes: [string]}, output: xwa2_newsletters_recommended
	// const queryNewslettersDirectory = '6190824427689257' // variables -> input -> {view: "RECOMMENDED", limit: 50, start_cursor: base64, filters: {country_codes: [string]}}
	const querySubscribedNewsletters = '6388546374527196' // variables -> empty, output: xwa2_newsletter_subscribed
	// const queryNewsletterSubscribers = '9800646650009898' // variables -> input -> {newsletter_id, count}, output: xwa2_newsletter_subscribers -> subscribers -> edges
	// const mutationMuteNewsletter = '6274038279359549' // variables -> {newsletter_id, updates->{description, settings}}, output: xwa2_newsletter_update -> NewsletterMetadata without viewer meta
	// const mutationUnmuteNewsletter = '6068417879924485'
	// const mutationUpdateNewsletter = '7150902998257522'
	// const mutationCreateNewsletter = '6234210096708695'
	// const mutationUnfollowNewsletter = '6392786840836363'
	// const mutationFollowNewsletter = '9926858900719341'

	return {
		...sock,
		getSubscribedNewsletters: async() => {
			const result = await mexQuery(querySubscribedNewsletters, {})
			if(result?.['xwa2_newsletter_subscribed']) {
				return convertKeysToCamelCase(result['xwa2_newsletter_subscribed']) as NewsletterMetadata[]
			} else {
				throw new Error('Missing "xwa2_newsletter_subscribed" in response')
			}
		},
	}
}
