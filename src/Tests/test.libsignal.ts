import { makeLibSignalRepository } from '../Signal/libsignal'
import { SignalAuthState, SignalDataTypeMap, SignalKeyStore } from '../Types'
import { addTransactionCapability, Curve, generateRegistrationId, generateSignalPubKey, signedKeyPair } from '../Utils'
import logger from '../Utils/logger'
import { makeMockSignalKeyStore } from './utils'

describe('Signal Tests', () => {

	it('should correctly encrypt/decrypt 1 message', async() => {
		const user1 = makeUser()
		const user2 = makeUser()

		const msg = Buffer.from('hello there!')

		await prepareForSendingMessage(user1, user2)

		const result = await user1.repository.encryptMessage(
			{ jid: user2.jid, data: msg }
		)

		const dec = await user2.repository.decryptMessage(
			{ jid: user1.jid, ...result }
		)

		expect(dec).toEqual(msg)
	})

	it('should correctly override a session', async() => {
		const user1 = makeUser()
		const user2 = makeUser()

		const msg = Buffer.from('hello there!')

		for(let preKeyId = 2; preKeyId <= 3;preKeyId++) {
			await prepareForSendingMessage(user1, user2, preKeyId)

			const result = await user1.repository.encryptMessage(
				{ jid: user2.jid, data: msg }
			)

			const dec = await user2.repository.decryptMessage(
				{ jid: user1.jid, ...result }
			)

			expect(dec).toEqual(msg)
		}
	})

	it('should correctly encrypt/decrypt multiple messages', async() => {
		const user1 = makeUser()
		const user2 = makeUser()

		const msg = Buffer.from('hello there!')

		await prepareForSendingMessage(user1, user2)

		for(let i = 0;i < 10;i++) {
			const result = await user1.repository.encryptMessage(
				{ jid: user2.jid, data: msg }
			)

			const dec = await user2.repository.decryptMessage(
				{ jid: user1.jid, ...result }
			)

			expect(dec).toEqual(msg)
		}
	})

	it('should encrypt/decrypt messages from group', async() => {
		const groupId = '123456@g.us'
		const participants = [...Array(5)].map(makeUser)

		const msg = Buffer.from('hello there!')

		const sender = participants[0]
		const enc = await sender.store.keys['transaction'](
			() => (
				sender.repository.encryptGroupMessage(
					{
						group: groupId,
						meId: sender.jid,
						data: msg
					}
				)
			)
		)

		for(const participant of participants) {
			if(participant === sender) {
				continue
			}

			await participant.store.keys['transaction'](
				async() => {
					await participant.repository.processSenderKeyDistributionMessage(
						{
							item: {
								groupId,
								axolotlSenderKeyDistributionMessage: enc.senderKeyDistributionMessage
							},
							authorJid: sender.jid
						}
					)

					const dec = await participant.repository.decryptGroupMessage(
						{
							group: groupId,
							authorJid: sender.jid,
							msg: enc.ciphertext
						}
					)
					expect(dec).toEqual(msg)
				}
			)
		}
	})
})

type User = ReturnType<typeof makeUser>

function makeUser() {
	const store = makeTestAuthState()
	const jid = `${Math.random().toString().replace('.', '')}@s.whatsapp.net`
	const repository = makeLibSignalRepository(store)
	return { store, jid, repository }
}

async function prepareForSendingMessage(
	sender: User,
	receiver: User,
	preKeyId = 2
) {
	const preKey = Curve.generateKeyPair()
	await sender.repository.injectE2ESession(
		{
			jid: receiver.jid,
			session: {
				registrationId: receiver.store.creds.registrationId,
				identityKey: generateSignalPubKey(receiver.store.creds.signedIdentityKey.public),
				signedPreKey: {
					keyId: receiver.store.creds.signedPreKey.keyId,
					publicKey: generateSignalPubKey(receiver.store.creds.signedPreKey.keyPair.public),
					signature: receiver.store.creds.signedPreKey.signature,
				},
				preKey: {
					keyId: preKeyId,
					publicKey: generateSignalPubKey(preKey.public),
				}
			}
		}
	)

	await receiver.store.keys.set({
		'pre-key': {
			[preKeyId]: preKey
		}
	})
}

function makeTestAuthState(): SignalAuthState {
	const identityKey = Curve.generateKeyPair()

	return {
		creds: {
			signedIdentityKey: identityKey,
			registrationId: generateRegistrationId(),
			signedPreKey: signedKeyPair(identityKey, 1),
		},
		keys: addTransactionCapability(
			makeMockSignalKeyStore(),
			logger,
			{
				maxCommitRetries: 1,
				delayBetweenTriesMs: 100
			}
		)
	}

	function getUniqueId(type: string, id: string) {
		return `${type}.${id}`
	}
}