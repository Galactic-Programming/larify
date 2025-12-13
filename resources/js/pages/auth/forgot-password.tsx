// Components
import { login } from '@/routes';
import { email } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { motion, Variants } from 'motion/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

// Animation variants
const formVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const fieldVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 12,
        },
    },
};

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Forgot password"
            description="Enter your email to receive a password reset link"
        >
            <Head title="Forgot password" />

            {status && (
                <motion.div
                    className="mb-4 text-center text-sm font-medium text-green-600"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    {status}
                </motion.div>
            )}

            <motion.div
                className="space-y-6"
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <>
                            <motion.div
                                className="grid gap-2"
                                variants={fieldVariants}
                            >
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                />

                                <InputError message={errors.email} />
                            </motion.div>

                            <motion.div
                                className="my-6 flex items-center justify-start"
                                variants={fieldVariants}
                            >
                                <Button
                                    className="w-full"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Email password reset link
                                </Button>
                            </motion.div>
                        </>
                    )}
                </Form>

                <motion.div
                    className="space-x-1 text-center text-sm text-muted-foreground"
                    variants={fieldVariants}
                >
                    <span>Or, return to</span>
                    <TextLink href={login()}>log in</TextLink>
                </motion.div>
            </motion.div>
        </AuthLayout>
    );
}
