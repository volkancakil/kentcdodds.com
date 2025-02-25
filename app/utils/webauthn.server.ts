import { createCookie } from '@remix-run/node'
import { type RegistrationResponseJSON } from '@simplewebauthn/server'
import { z } from 'zod'
import { getDomainUrl } from './misc.tsx'

export const passkeyCookie = createCookie('webauthn-challenge', {
	path: '/',
	sameSite: 'lax',
	httpOnly: true,
	maxAge: 60 * 60 * 2,
	secure: process.env.NODE_ENV === 'production',
	secrets: [process.env.SESSION_SECRET],
})

export const PasskeyCookieSchema = z.object({
	challenge: z.string(),
	userId: z.string(),
})

export const RegistrationResponseSchema = z.object({
	id: z.string(),
	rawId: z.string(),
	response: z.object({
		clientDataJSON: z.string(),
		attestationObject: z.string(),
		transports: z
			.array(
				z.enum([
					'ble',
					'cable',
					'hybrid',
					'internal',
					'nfc',
					'smart-card',
					'usb',
				]),
			)
			.optional(),
	}),
	authenticatorAttachment: z.enum(['cross-platform', 'platform']).optional(),
	clientExtensionResults: z.object({
		credProps: z
			.object({
				rk: z.boolean(),
			})
			.optional(),
	}),
	type: z.literal('public-key'),
}) satisfies z.ZodType<RegistrationResponseJSON>

export function getWebAuthnConfig(request: Request) {
	const url = new URL(getDomainUrl(request))
	return {
		rpName: `KCD (${url.hostname})`,
		rpID: url.hostname,
		origin: url.origin,
		// Common options for both registration and authentication
		authenticatorSelection: {
			residentKey: 'preferred',
			userVerification: 'preferred',
		},
	} as const
}
