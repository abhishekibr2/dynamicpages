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
import fetch from 'node-fetch'
import axios from 'axios'
import child_process from 'child_process'


export async function POST(request: Request) {
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
      fetch,
      axios
    }

    // Create a sandbox with console.log and require
    const sandbox = {
      output: '',
      consoleOutput: '',
      module: { exports: {} },
      fetch,
      setTimeout,
      require: (moduleName: string) => {
        // Check if the module is in the predefined list
        if (modules.hasOwnProperty(moduleName)) {
          return modules[moduleName as keyof typeof modules]
        } else {
          throw new Error(`Module '${moduleName}' is not allowed for import`)
        }
      },
      console: {
        log: (...args: any[]) => {
          sandbox.consoleOutput += args.map(arg =>
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
      // Wrap the code in an async IIFE to support async/await
      const wrappedCode = `
        (async () => {
          try {
            ${code}
            // Wait a bit for any pending async operations
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.log('Error in execution:', error.message);
          }
        })()`;

      // Run the code in the sandbox and await the result
      const result = await runInNewContext(wrappedCode, sandbox, {
        timeout: 5000, // 5 seconds timeout
        filename: 'usercode.js'
      });

      return NextResponse.json({
        success: true,
        output: sandbox.output || 'Code executed successfully.',
        consoleOutput: sandbox.consoleOutput || 'No console output',
        error: null
      })
    } catch (error: any) {
      // Extract line number from error stack
      const stack = error.stack || ''
      const lineMatch = stack.match(/usercode\.js:(\d+)/)
      const lineNumber = lineMatch ? parseInt(lineMatch[1]) : null

      // Format error output
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
        // Fallback if we can't get the line number
        errorOutput = `Error: ${error.message}\n\nFull code:\n${codeLines.map((line: string, i: number) =>
          ` ${(i + 1).toString().padStart(3, ' ')} | ${line}`
        ).join('\n')}`
      }

      return NextResponse.json({
        success: false,
        output: null,
        error: errorOutput
      })
    }
  } catch (error: any) {
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