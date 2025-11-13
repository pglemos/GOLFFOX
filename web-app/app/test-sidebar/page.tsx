"use client";

import { SidebarDemo } from "@/components/ui/sidebar-demo";

export default function TestSidebarPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Teste do Sidebar Component</h1>
        <SidebarDemo />
      </div>
    </div>
  );
}

