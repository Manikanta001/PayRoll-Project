"use client";

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * @type {React.ForwardRefRenderFunction<HTMLDivElement, React.PropsWithChildren<{className?: string}>>}
 */
const CardImpl = (props, ref) => {
  const { className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
      {...rest} />
  );
};
const Card = React.forwardRef(CardImpl);
Card.displayName = "Card"

/**
 * @type {React.ForwardRefRenderFunction<HTMLDivElement, React.PropsWithChildren<{className?: string}>>}
 */
const CardHeaderImpl = (props, ref) => {
  const { className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...rest} />
  );
};
const CardHeader = React.forwardRef(CardHeaderImpl);
CardHeader.displayName = "CardHeader"

/**
 * @type {React.ForwardRefRenderFunction<HTMLDivElement, React.PropsWithChildren<{className?: string}>>}
 */
const CardTitleImpl = (props, ref) => {
  const { className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...rest} />
  );
};
const CardTitle = React.forwardRef(CardTitleImpl);
CardTitle.displayName = "CardTitle"

/**
 * @type {React.ForwardRefRenderFunction<HTMLDivElement, React.PropsWithChildren<{className?: string}>>}
 */
const CardDescriptionImpl = (props, ref) => {
  const { className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...rest} />
  );
};
const CardDescription = React.forwardRef(CardDescriptionImpl);
CardDescription.displayName = "CardDescription"

/**
 * @type {React.ForwardRefRenderFunction<HTMLDivElement, React.PropsWithChildren<{className?: string}>>}
 */
const CardContentImpl = (props, ref) => {
  const { className, ...rest } = props;
  return (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...rest} />
  );
};
const CardContent = React.forwardRef(CardContentImpl);
CardContent.displayName = "CardContent"

/**
 * @type {React.ForwardRefRenderFunction<HTMLDivElement, React.PropsWithChildren<{className?: string}>>}
 */
const CardFooterImpl = (props, ref) => {
  const { className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn("flex items-center p-6 pt-0", className)}
      {...rest} />
  );
};
const CardFooter = React.forwardRef(CardFooterImpl);
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
