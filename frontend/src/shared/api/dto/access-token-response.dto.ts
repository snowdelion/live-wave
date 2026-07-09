import z from 'zod'

export const AccessTokenResponseSchema = z.object({
  accessToken: z.string().min(32),
})

export type AccessTokenResponse = z.infer<typeof AccessTokenResponseSchema>
