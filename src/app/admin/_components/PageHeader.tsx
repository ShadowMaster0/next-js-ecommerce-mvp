import React from "react";

export function PageHeader({ children }: 
    { children: React.ReactNode }) {
  return <h1 className="text-4xl font-semibold mb-4">

    {children}
    
    </h1>;
}