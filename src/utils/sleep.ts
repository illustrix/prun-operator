export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const waitFor = async <T>(condition: () => T, timeout = 10000) => {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    const result = condition()
    if (result) return result
    await sleep(100)
  }
  throw new Error('Condition not met within timeout')
}
