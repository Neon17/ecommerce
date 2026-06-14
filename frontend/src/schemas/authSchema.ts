import { z } from 'zod'

export const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters long"),
    email: z.string().email("Invalid email address"),
    password1: z.string().min(6, "Password must be at least 6 characters long"),
    password2: z.string().min(6, "Password must be at least 6 characters long")
}).refine(data => data.password1 === data.password2, {
    message: "Passwords do not match",
    path: ["password2"]
})

export type RegisterFormValues = z.infer<typeof registerSchema>
