import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { generateRegistrationOptions } from '@simplewebauthn/server'
import { prisma } from '#app/utils/prisma.server.js'
import { requireUser } from '#app/utils/session.server.js'
import {
	PasskeyCookieSchema,
	passkeyCookie,
	getWebAuthnConfig,
} from '#app/utils/webauthn.server.js'

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await requireUser(request)
	const passkeys = await prisma.passkey.findMany({
		where: { userId: user.id },
		select: { id: true },
	})

	const config = getWebAuthnConfig(request)
	const options = await generateRegistrationOptions({
		rpName: config.rpName,
		rpID: config.rpID,
		userName: user.email,
		userID: new TextEncoder().encode(user.id),
		userDisplayName: user.firstName,
		attestationType: 'none',
		excludeCredentials: passkeys,
		authenticatorSelection: config.authenticatorSelection,
	})

	return json(
		{ options },
		{
			headers: {
				'Set-Cookie': await passkeyCookie.serialize(
					PasskeyCookieSchema.parse({
						challenge: options.challenge,
						userId: options.user.id,
					}),
				),
			},
		},
	)
}
