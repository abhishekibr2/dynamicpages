import { NextResponse } from 'next/server'
import { runInNewContext } from 'vm'
// Import commonly used modules
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

export async function POST(request: Request) {
  // Enable CORS
  const origin = request.headers.get('origin') || ''
  
  // Handle CORS preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  try {
    const { code } = await request.json()
    
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
      }
    }

    try {
      runInNewContext(code, sandbox, {
        timeout: 5000,
        filename: 'usercode.js'
      })

      return new NextResponse(
        JSON.stringify({ 
          success: true,
          output: sandbox.output || 'Code executed successfully (no output)',
          error: null 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    } catch (error: any) {
      const stack = error.stack || ''
      const lineMatch = stack.match(/usercode\.js:(\d+)/)
      const lineNumber = lineMatch ? parseInt(lineMatch[1]) : null

      const codeLines = code.split('\n')
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

      return new NextResponse(
        JSON.stringify({ 
          success: false,
          output: null,
          error: errorOutput
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  } catch (error: any) {
    return new NextResponse(
      JSON.stringify({ 
        success: false,
        output: null,
        error: `Server Error: ${error.message}`
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
} 