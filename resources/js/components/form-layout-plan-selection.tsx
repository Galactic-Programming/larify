"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Check, CircleCheck, ExternalLink } from "lucide-react";
import { useState } from "react";

export interface SelectOption {
    value: string;
    label: string;
}

export interface PlanFeature {
    feature: string;
}

export interface Plan {
    id: string;
    name: string;
    features: PlanFeature[];
    price: string;
    priceLabel?: string;
    href?: string;
    isRecommended?: boolean;
}

export interface Highlight {
    id: string | number;
    feature: string;
}

export interface PlanSelectionFormData {
    organization: string;
    workspace: string;
    region: string;
    selectedPlan: string;
}

export interface FormLayoutPlanSelectionProps {
    /** Form title */
    title?: string;
    /** Organizations list */
    organizations?: SelectOption[];
    /** Default organization */
    defaultOrganization?: string;
    /** Regions list */
    regions?: SelectOption[];
    /** Default region */
    defaultRegion?: string;
    /** Default workspace name */
    defaultWorkspace?: string;
    /** Plans to choose from */
    plans: Plan[];
    /** Default selected plan id */
    defaultPlan?: string;
    /** Sidebar highlights */
    highlights?: Highlight[];
    /** Sidebar title */
    sidebarTitle?: string;
    /** Sidebar description */
    sidebarDescription?: string;
    /** Sidebar "Learn more" link */
    sidebarLearnMoreHref?: string;
    /** Plan type label */
    planTypeLabel?: string;
    /** Whether plan is required */
    planRequired?: boolean;
    /** Region field description */
    regionDescription?: string;
    /** Submit button text */
    submitButtonText?: string;
    /** Cancel button text */
    cancelButtonText?: string;
    /** Callback when form is submitted */
    onSubmit?: (data: PlanSelectionFormData) => void;
    /** Callback when cancel is clicked */
    onCancel?: () => void;
    /** Custom class name */
    className?: string;
    /** Whether form is loading */
    isLoading?: boolean;
}

export default function FormLayoutPlanSelection({
    title = "Create new design workspace",
    organizations,
    defaultOrganization,
    regions,
    defaultRegion,
    defaultWorkspace = "",
    plans,
    defaultPlan,
    highlights,
    sidebarTitle = "Choose the right plan for your design team",
    sidebarDescription = "Our flexible plans are designed to scale with your team's needs. All plans include core design collaboration features with varying levels of storage and support.",
    sidebarLearnMoreHref = "#",
    planTypeLabel = "Plan type",
    planRequired = true,
    regionDescription = "For best performance, choose a region closest to your operations",
    submitButtonText = "Update",
    cancelButtonText = "Cancel",
    onSubmit,
    onCancel,
    className,
    isLoading = false,
}: FormLayoutPlanSelectionProps) {
    const [organization, setOrganization] = useState(defaultOrganization ?? organizations?.[0]?.value ?? "");
    const [workspace, setWorkspace] = useState(defaultWorkspace);
    const [region, setRegion] = useState(defaultRegion ?? regions?.[0]?.value ?? "");
    const [selectedPlan, setSelectedPlan] = useState(() => {
        if (defaultPlan) return defaultPlan;
        const recommended = plans.find((p) => p.isRecommended);
        return recommended?.id ?? plans[0]?.id ?? "";
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.({
            organization,
            workspace,
            region,
            selectedPlan,
        });
    };

    return (
        <div className={cn("flex items-center justify-center p-10", className)}>
            <form className="sm:mx-auto sm:max-w-7xl" onSubmit={handleSubmit}>
                <h3 className="text-xl font-semibold text-foreground">{title}</h3>
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
                    <div className="mt-6 lg:col-span-7">
                        <div className="space-y-4 md:space-y-6">
                            <div className="md:flex md:items-center md:space-x-4">
                                <div className="md:w-1/4">
                                    <Field className="gap-2">
                                        <FieldLabel htmlFor="organization">Organization</FieldLabel>
                                        <Select value={organization} onValueChange={setOrganization}>
                                            <SelectTrigger
                                                id="organization"
                                                name="organization"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Select organization" />
                                            </SelectTrigger>
                                            <SelectContent>
                                            {organizations?.map((org) => (
                                                    <SelectItem key={org.value} value={org.value}>
                                                        {org.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>
                                <div className="mt-4 md:mt-0 md:w-3/4">
                                    <Field className="gap-2">
                                        <FieldLabel htmlFor="workspace">Workspace name</FieldLabel>
                                        <Input
                                            id="workspace"
                                            name="workspace"
                                            value={workspace}
                                            onChange={(e) => setWorkspace(e.target.value)}
                                        />
                                    </Field>
                                </div>
                            </div>
                            <div>
                                <Field className="gap-2">
                                    <FieldLabel htmlFor="region">Region</FieldLabel>
                                    <Select value={region} onValueChange={setRegion}>
                                        <SelectTrigger id="region" name="region">
                                            <SelectValue placeholder="Select region" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {regions?.map((reg) => (
                                                <SelectItem key={reg.value} value={reg.value}>
                                                    {reg.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {regionDescription && (
                                        <FieldDescription>{regionDescription}</FieldDescription>
                                    )}
                                </Field>
                            </div>
                        </div>
                        <h4 className="mt-14 font-medium">
                            {planTypeLabel}
                            {planRequired && <span className="text-red-500">*</span>}
                        </h4>
                        <RadioGroup
                            value={selectedPlan}
                            onValueChange={setSelectedPlan}
                            className="mt-4 space-y-4"
                        >
                            {plans.map((plan) => (
                                <label
                                    key={plan.id}
                                    htmlFor={plan.id}
                                    className={cn(
                                        "relative block cursor-pointer rounded-md border bg-background transition",
                                        selectedPlan === plan.id
                                            ? "border-primary/20 ring-2 ring-primary/20"
                                            : "border-border"
                                    )}
                                >
                                    <div className="flex items-start space-x-4 px-6 py-4">
                                        <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
                                            <RadioGroupItem value={plan.id} id={plan.id} />
                                        </div>
                                        <div className="w-full">
                                            <p className="leading-6">
                                                <span className="font-semibold text-foreground">
                                                    {plan.name}
                                                </span>
                                                {plan.isRecommended && (
                                                    <Badge variant="secondary" className="ml-2">
                                                        recommended
                                                    </Badge>
                                                )}
                                            </p>
                                            <ul className="mt-2 space-y-1">
                                                {plan.features.map((feature, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-center gap-2 text-sm"
                                                    >
                                                        <Check
                                                            className="h-4 w-4 text-muted-foreground"
                                                            aria-hidden={true}
                                                        />
                                                        {feature.feature}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between rounded-b-md border-t border-border bg-muted px-6 py-3">
                                        {plan.href ? (
                                            <a
                                                href={plan.href}
                                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline hover:underline-offset-4"
                                            >
                                                Learn more
                                                <ExternalLink className="h-4 w-4" aria-hidden={true} />
                                            </a>
                                        ) : (
                                            <div />
                                        )}
                                        <div>
                                            <span className="text-lg font-semibold text-foreground">
                                                {plan.price}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {plan.priceLabel ?? "/mo"}
                                            </span>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </RadioGroup>
                    </div>
                    <div className="lg:col-span-5">
                        <Card className="bg-muted">
                            <CardContent>
                                <h4 className="text-sm font-semibold text-foreground">
                                    {sidebarTitle}
                                </h4>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {sidebarDescription}
                                </p>
                                {highlights && highlights.length > 0 && (
                                    <ul className="mt-4 space-y-1">
                                        {highlights.map((item) => (
                                            <li
                                                key={item.id}
                                                className="flex items-center space-x-2 py-1.5 text-foreground"
                                            >
                                                <CircleCheck className="h-5 w-5 text-primary" />
                                                <span className="truncate text-sm">{item.feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {sidebarLearnMoreHref && (
                                    <a
                                        href={sidebarLearnMoreHref}
                                        className="mt-4 inline-flex items-center gap-1 text-sm text-primary"
                                    >
                                        Learn more
                                        <ExternalLink className="h-4 w-4" aria-hidden={true} />
                                    </a>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <Separator className="my-10" />
                <div className="flex items-center justify-end space-x-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        {cancelButtonText}
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Loading..." : submitButtonText}
                    </Button>
                </div>
            </form>
        </div>
    );
}
