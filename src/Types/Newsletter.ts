export interface NewsletterMuted {
  muted: boolean
}

interface WrappedNewsletterState {
  type: string
}

export interface NewsletterMetadata {
  id: string
  state: WrappedNewsletterState
  threadMetadata: NewsletterThreadMetadata
  viewerMetadata: NewsletterViewerMetadata | null
}

interface NewsletterViewerMetadata {
  mute: string
  role: string
}

interface NewsletterReactionSettings {
  value: string
}

interface NewsletterSettings {
  reactionCodes: NewsletterReactionSettings
}

interface ProfilePictureInfo {
  url: string
  id: string
  type: string
  directPath: string
}

interface NewsletterThreadMetadata {
  creationTime: string
  invite: string
  name: NewsletterText
  description: NewsletterText
  subscribersCount: number
  verification: string
  picture: ProfilePictureInfo | null
  preview: ProfilePictureInfo
  settings: NewsletterSettings
}

interface NewsletterText {
  text: string
  id: string
  updateTime: string
}

export interface NewsletterMessage {
  messageServerId: string
  viewsCount: number
  reactionCounts: { [key: string]: number }
  message: any // Replace with actual type
}

interface GraphQLErrorExtensions {
  errorCode: number
  isRetryable: boolean
  severity: string
}

interface GraphQLError {
  extensions: GraphQLErrorExtensions
  message: string
  path: string[]
}

interface GraphQLErrors extends Array<GraphQLError> {}

export interface GraphQLResponse {
  data: any // Replace with actual type
  errors: GraphQLErrors
}