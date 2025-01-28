import { NextRequest, NextResponse } from 'next/server'
import { Script, createContext } from 'vm'
import { getPageByEndpoint, addLog } from '@/utils/supabase/actions/page'
import { getPreDefinedVariable } from '@/utils/supabase/actions/preDefinedVars'

interface ExecutionResponse {
  success: boolean
  response?: {
    body: any
    status: number
    headers: Record<string, string>
  }
  logs: string[]
  error?: string
  result?: any
  lineNumber?: number | null
}


const executeCodeInVM = (code: string, context: any, timeout = 5000, extractedVars: string[] | null, requestData: any | null): Promise<ExecutionResponse> => {
  return new Promise((resolve) => {
    try {
      // Set up logging collection
      const logs: string[] = [];
      // Create VM context with necessary globals
      const vmContext = createContext({
        console: {
          log: (...args: any[]) => {
            const log = args.map(arg => {
              try {
                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
              } catch (e) {
                return '[Unstringifiable Object]';
              }
            }).join(' ');
            logs.push(log);
          },
          error: (...args: any[]) => {
            const log = args.map(arg => {
              try {
                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
              } catch (e) {
                return '[Unstringifiable Object]';
              }
            }).join(' ');
            logs.push(`ERROR: ${log}`);
          }
        },
        fetch: global.fetch,
        // Create axios-like interface
        axios: {
          async request(config: any) {
            const options = {
              method: config.method || 'get',
              headers: config.headers || {},
              body: config.data ? JSON.stringify(config.data) : undefined
            };

            const response = await fetch(config.url, options);
            const data = await response.json();

            return {
              data,
              status: response.status,
              statusText: response.statusText,
              headers: response.headers
            };
          },
          get(url: string, config = {}) {
            return this.request({ ...config, url, method: 'get' });
          },
          post(url: string, data: any, config = {}) {
            return this.request({ ...config, url, method: 'post', data });
          }
        },
        request: context.request,
        response: context.response,
        data: context.request.body?.data,
        setTimeout,
        clearTimeout,
        Promise
      });
      const preDefinedVars = extractedVars ? extractedVars.join('\n') : ''
      let requestDataString;
      try {
        requestDataString = requestData;
        const data = requestDataString ? JSON.stringify(requestDataString) : 'null'
        const wrappedCode = `
          (async function() {
            try {
              const result = await (async () => {
                const data = ${data}
                ${preDefinedVars}
                ${code}
              })();
              return result;
            } catch(err) {
              console.error('Error:', err.message);
              console.error('Stack:', err.stack);
              response.body = { error: err.message };
              response.status = 500;
              throw err;
            }
          })();
        `;

        // Create and run script
        const script = new Script(wrappedCode);
        const result = script.runInContext(vmContext, { timeout });

        // Handle Promise result
        Promise.resolve(result)
          .then((finalResult) => {
            resolve({
              success: true,
              response: vmContext.response,
              logs,
              result: finalResult
            });
          })
          .catch((error) => {
            let lineNumber = null;
            if (error.stack) {
              const match = error.stack.match(/<anonymous>:(\d+):\d+/);
              if (match) {
                lineNumber = parseInt(match[1], 10);
                lineNumber = Math.max(1, lineNumber - 2);
              }
            }
            
            logs.push(`Error: ${error.message}`);
            if (error.stack) {
              logs.push(`Stack: ${error.stack}`);
            }

            resolve({
              success: false,
              error: `${error.message}${lineNumber ? ` (Line ${lineNumber})` : ''}`,
              logs,
              lineNumber
            });
          });
      } catch (error: any) {
        logs.push(`Error: ${error.message}`);
        if (error.stack) {
          logs.push(`Stack: ${error.stack}`);
        }
        resolve({
          success: false,
          error: error.message,
          logs,
          lineNumber: null
        });
      }
    } catch (error: any) {
      resolve({
        success: false,
        error: error.message,
        logs: [`Fatal Error: ${error.message}`, error.stack || ''],
        lineNumber: null
      });
    }
  });
};

export async function GET(request: NextRequest) {
  const preDefinedVariables = request.nextUrl.searchParams.get('preDefinedVariables')
  return handleRequest(request, 'GET', null, preDefinedVariables)
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  const preDefinedVariables = request.nextUrl.searchParams.get('preDefinedVariables')
  return handleRequest(request, 'POST', data, preDefinedVariables)
}

async function handleRequest(request: NextRequest, method: string, data: any | null, preDefinedVariables: string | null) {
  let page;
  try {
    const pathname = request.nextUrl.pathname.split('/api/')[1]

    page = await getPageByEndpoint(pathname, method)

    if (!page) {
      const notFoundLog = {
        timestamp: new Date().toISOString(),
        output: 'Endpoint not found',
        console: '',
        returnValue: 'Error',
        request: JSON.stringify({
          method,
          url: request.url,
          query: Object.fromEntries(request.nextUrl.searchParams),
          body: method === 'POST' ? data : null
        }),
        success: false
      }
      
      // Store the not found error
      if (page?.id) {
        addLog(page.id, notFoundLog).catch(error => {
          console.error('Failed to store not found log:', error)
        })
      }

      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      )
    }

    // Prepare the execution context
    const context = {
      request: {
        method,
        url: request.url,
        headers: Object.fromEntries(request.headers),
        query: Object.fromEntries(request.nextUrl.searchParams),
        body: method === 'POST' ? {
          code: data?.code || '',
          data: data?.data || null
        } : null
      },
      response: {
        status: 200,
        headers: {},
        body: null
      }
    }

    let extractedVars = null
    if (preDefinedVariables) {
      const preDefinedVariable = await getPreDefinedVariable(preDefinedVariables)
      extractedVars = preDefinedVariable?.vars || null
    }

    try {
      console.log(data)
      const result = await executeCodeInVM(page.code, context, 5000, extractedVars, data)

      // Store logs asynchronously without waiting
      const logEntry = {
        timestamp: new Date().toISOString(),
        output: result.success 
          ? (result.result ? JSON.stringify(result.result) : '') 
          : (result.error || 'Execution failed'),
        console: result.logs.join('\n') || '',
        returnValue: result.success 
          ? (result.result ? JSON.stringify(result.result) : '') 
          : result.error || 'Error',
        request: JSON.stringify({
          method,
          url: request.url,
          query: Object.fromEntries(request.nextUrl.searchParams),
          body: method === 'POST' ? data : null
        }),
        success: result.success
      }

      // Fire and forget log storage
      addLog(page.id, logEntry).catch(error => {
        console.error('Failed to store logs:', error)
      })

      if (!result.success) {
        return NextResponse.json({
          success: false,
          output: result.logs.join('\n'),
          error: result.error,
          logs: result.logs
        }, { status: 400 })
      }

      return NextResponse.json(
        (result.response?.body) || {
          success: true,
          output: result.result,
          logs: result.logs.join('\n') || 'No console output',
          error: null
        },
        {
          status: result.response?.status || 200,
          headers: result.response?.headers || {}
        }
      )

    } catch (error: any) {
      // Store error logs asynchronously without waiting
      const errorLogEntry = {
        timestamp: new Date().toISOString(),
        output: error.message || "Error in execution",
        console: error.stack || error.message,
        returnValue: error.message || 'Error',
        request: JSON.stringify({
          method,
          url: request.url,
          query: Object.fromEntries(request.nextUrl.searchParams),
          body: method === 'POST' ? data : null
        }),
        success: false
      }

      // Fire and forget error log storage
      addLog(page.id, errorLogEntry).catch(error => {
        console.error('Failed to store error logs:', error)
      })

      return NextResponse.json({
        success: false,
        output: error.message || null,
        error: `Execution Error: ${error.message}`,
        logs: [error.message, error.stack].filter(Boolean)
      }, { status: 400 })
    }

  } catch (error: any) {
    // Store internal server error logs
    const serverErrorLog = {
      timestamp: new Date().toISOString(),
      output: `Server Error: ${error.message}`,
      console: error.stack || error.message,
      returnValue: 'Internal Server Error',
      request: JSON.stringify({
        method,
        url: request.url,
        query: Object.fromEntries(request.nextUrl.searchParams),
        body: method === 'POST' ? data : null
      }),
      success: false
    }

    if (page?.id) {
      addLog(page.id, serverErrorLog).catch(error => {
        console.error('Failed to store server error log:', error)
      })
    }

    return NextResponse.json(
      {
        success: false,
        output: null,
        error: `Server Error: ${error.message}`,
        details: error.stack,
        logs: [error.message, error.stack].filter(Boolean)
      },
      { status: 500 }
    )
  }
} 