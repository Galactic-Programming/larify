import { useState } from 'react';

import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';
import { motion, Variants } from 'motion/react';

import InputError from '@/components/input-error';
import { SocialLoginButtons } from '@/components/social-login-buttons';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

// Animation variants for staggered form fields
const formVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.06,
        },
    },
};

const fieldVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 12,
        },
    },
};

export default function Register() {
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    return (
        <AuthLayout
            title="Create an account"
            description="Enter your details below to create your account"
        >
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <motion.div
                            className="grid gap-6"
                            variants={formVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div
                                className="grid gap-2"
                                variants={fieldVariants}
                            >
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Full name"
                                />
                                <InputError
                                    message={errors.name}
                                    className="mt-2"
                                />
                            </motion.div>

                            <motion.div
                                className="grid gap-2"
                                variants={fieldVariants}
                            >
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </motion.div>

                            <motion.div
                                className="grid gap-2"
                                variants={fieldVariants}
                            >
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </motion.div>

                            <motion.div
                                className="grid gap-2"
                                variants={fieldVariants}
                            >
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </motion.div>

                            <motion.div
                                className="flex items-start space-x-3"
                                variants={fieldVariants}
                            >
                                <Checkbox
                                    id="terms"
                                    name="terms"
                                    value="on"
                                    checked={agreedToTerms}
                                    onCheckedChange={(checked) =>
                                        setAgreedToTerms(checked === true)
                                    }
                                    tabIndex={5}
                                />
                                <Label
                                    htmlFor="terms"
                                    className="text-sm leading-relaxed font-normal"
                                >
                                    I agree to the{' '}
                                    <TextLink href="/terms" tabIndex={6}>
                                        Terms of Service
                                    </TextLink>{' '}
                                    and{' '}
                                    <TextLink href="/privacy" tabIndex={7}>
                                        Privacy Policy
                                    </TextLink>
                                </Label>
                            </motion.div>

                            <motion.div variants={fieldVariants}>
                                <Button
                                    type="submit"
                                    className="mt-2 w-full"
                                    tabIndex={8}
                                    disabled={!agreedToTerms || processing}
                                    data-test="register-user-button"
                                >
                                    {processing && <Spinner />}
                                    Create account
                                </Button>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            className="text-center text-sm text-muted-foreground"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            Already have an account?{' '}
                            <TextLink href={login()} tabIndex={9}>
                                Log in
                            </TextLink>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <SocialLoginButtons className="flex flex-col gap-6" />
                        </motion.div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
