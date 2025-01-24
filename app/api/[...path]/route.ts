import { NextRequest, NextResponse } from 'next/server'
import { runInNewContext } from 'vm'
import express from 'express'
import fs from 'fs'
import path from 'path'
import http from 'http'
import https from 'https'
import url from 'url'
import querystring from 'querystring'
import crypto from 'crypto'
import util from 'util'
import events from 'events'
import stream from 'stream'
import zlib from 'zlib'
import os from 'os'
import child_process from 'child_process'
import { getPageByEndpoint } from '@/utils/supabase/actions/page'

// Create a modules object with commonly used modules
const modules = {
  express,
  fs,
  path,
  http,
  https,
  url,
  querystring,
  crypto,
  util,
  events,
  stream,
  zlib,
  os,
  child_process,
}

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET')
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST')
}

async function handleRequest(request: NextRequest, method: string) {
  try {
    const pathname = request.nextUrl.pathname.split('/api/')[1]
    console.log('Pathname:', pathname)
    // Get the page from the database using the endpoint and method
    console.log('Getting page by endpoint:', pathname, 'Method:', method)
    const page = await getPageByEndpoint(pathname, method)

    if (!page) {
      console.log('Endpoint not found')
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      )
    }

    console.log('Found page:', page.id)

    // Create a sandbox with console.log and require
    const sandbox = {
      output: '',
      module: { exports: {} },
      require: (moduleName: string) => {
        if (modules.hasOwnProperty(moduleName)) {
          return modules[moduleName as keyof typeof modules]
        } else {
          throw new Error(`Module '${moduleName}' is not allowed for import`)
        }
      },
      console: {
        log: (...args: any[]) => {
          sandbox.output += args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
          ).join(' ') + '\n'
        }
      },
      process: {
        ...process,
        env: {} // Restrict access to environment variables
      },
      request: {
        method,
        url: request.url,
        headers: Object.fromEntries(request.headers),
        query: Object.fromEntries(request.nextUrl.searchParams),
        body: method === 'POST' ? await request.json().catch(() => ({})) : undefined
      },
      response: {
        status: 200,
        headers: {} as Record<string, string>,
        body: null as any
      }
    }

    try {
      // Run the code in the sandbox
      runInNewContext(page.code, sandbox, {
        timeout: 5000,
        filename: 'usercode.js'
      })

      // Allow custom response from the code
      const response = NextResponse.json(
        sandbox.response.body || { 
          success: true,
          output: sandbox.output || 'Code executed successfully (no output)',
          error: null 
        },
        { 
          status: sandbox.response.status,
          headers: sandbox.response.headers
        }
      )

      return response
    } catch (error: any) {
      const stack = error.stack || ''
      const lineMatch = stack.match(/usercode\.js:(\d+)/)
      const lineNumber = lineMatch ? parseInt(lineMatch[1]) : null

      const codeLines = page.code.split('\n')
      let errorOutput = ''

      if (lineNumber) {
        const start = Math.max(0, lineNumber - 3)
        const end = Math.min(codeLines.length, lineNumber + 2)
        
        const codeSnippet = codeLines
          .slice(start, end)
          .map((line: string, index: number) => {
            const currentLineNum = start + index + 1
            const isErrorLine = currentLineNum === lineNumber
            return `${isErrorLine ? '>' : ' '} ${currentLineNum.toString().padStart(3, ' ')} | ${line}`
          })
          .join('\n')

        errorOutput = `Error at line ${lineNumber}:\n${error.message}\n\nCode snippet:\n${codeSnippet}`
      } else {
        errorOutput = `Error: ${error.message}\n\nFull code:\n${codeLines.map((line: string, i: number) => 
          ` ${(i + 1).toString().padStart(3, ' ')} | ${line}`
        ).join('\n')}`
      }

      return NextResponse.json({ 
        success: false,
        output: null,
        error: errorOutput
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { 
        success: false,
        output: null,
        error: `Server Error: ${error.message}`
      },
      { status: 500 }
    )
  }
} 