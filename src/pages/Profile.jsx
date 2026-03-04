"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Profile() {
  const { user } = useAuth();
  const [initials, setInitials] = useState("U");

  useEffect(() => {
    if (user?.full_name) {
      const text = user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
      setInitials(text || "U");
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-sm">You need to sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.full_name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {user.role || "employee"}
              </Badge>
              {user.is_active === false ? (
                <Badge variant="destructive" className="">Inactive</Badge>
              ) : (
                <Badge variant="secondary" className="">Active</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Basic information about your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Full name</span>
            <span className="font-medium">{user.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{user.role || "employee"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

