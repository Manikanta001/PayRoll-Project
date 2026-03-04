"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/**
 * @type {React.ForwardRefRenderFunction<any, React.PropsWithChildren<{className?: string}>>}
 */
const AvatarImpl = (props, ref) => {
  const { className, ...rest } = props;
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
      {...rest} />
  );
};
const Avatar = React.forwardRef(AvatarImpl);
Avatar.displayName = AvatarPrimitive.Root.displayName

/**
 * @type {React.ForwardRefRenderFunction<any, React.PropsWithChildren<{className?: string}>>}
 */
const AvatarImageImpl = (props, ref) => {
  const { className, ...rest } = props;
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full", className)}
      {...rest} />
  );
};
const AvatarImage = React.forwardRef(AvatarImageImpl);
AvatarImage.displayName = AvatarPrimitive.Image.displayName

/**
 * @type {React.ForwardRefRenderFunction<any, React.PropsWithChildren<{className?: string}>>}
 */
const AvatarFallbackImpl = (props, ref) => {
  const { className, ...rest } = props;
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...rest} />
  );
};
const AvatarFallback = React.forwardRef(AvatarFallbackImpl);
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
