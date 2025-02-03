'use client'

import { CodeIcon, FileIcon, ShoppingBagIcon, SquareFunctionIcon,  } from "lucide-react"
import Link from "next/link"

interface DashboardCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

const DashboardCard = ({ title, description, icon, href }: DashboardCardProps) => {
  return (
    <Link 
      href={href}
      className={`p-6 rounded-xl transition-transform hover:scale-105 cursor-pointer border`}
    >
      <div className="flex flex-col h-full space-y-4">
        <div className="p-3 rounded-full w-fit">
          {icon}
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p>{description}</p>

      </div>
    </Link>
  )
}

export default function ProtectedPage() {
  const dashboardItems = [
    {
      title: "Code Executor Pages",
      description: "Manage and create new pages for code execution with custom configurations",
      icon: <FileIcon className="w-6 h-6" />,
      href: "/protected/pages",
    },
    {
      title: "Pre-defined Code",
      description: "Configure and manage pre-defined code snippets for your pages",
      icon: <CodeIcon className="w-6 h-6" />,
      href: "/protected/pre-defined-vars",
    },
    {
      title: "Pre-defined Functions",
      description: "Set up and manage reusable functions for your code executor",
      icon: <SquareFunctionIcon className="w-6 h-6" />,
      href: "/protected/pre-defined-functions",
    },
    {
      title: "Categories",
      description: "Manage and create new categories for your code executor",
      icon: <ShoppingBagIcon className="w-6 h-6" />,
      href: "/protected/categories",
    }
  ]

  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.map((item, index) => (
          <DashboardCard key={index} {...item} />
        ))}
      </div>
    </div>
  )
}
