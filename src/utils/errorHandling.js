/**
 * @param {Error} error - error object from axios/API call
 * @param {string} defaultMessage - default message if no specific error is found
 * @returns {string} error message for people that have no idea wtf is going on
 */
export function getErrorMessage(error, defaultMessage = 'An error occurred. Please try again.') {
  if (!error) return defaultMessage

  //check network/connection errors
  if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
    return 'Network error: Unable to connect to the server. Please check your internet connection and try again.'
  }

  //check for 500 errors
  if (error.response?.status === 500) {
    const detail = error.response?.data?.detail || ''
    const requestUrl = error.config?.url || ''

    //check if storage/upload related error
    const isStorageError =
      detail.includes('MinIO') ||
      detail.includes('storage') ||
      detail.includes('cdn') ||
      detail.includes('Failed to resolve') ||
      detail.includes('NameResolutionError') ||
      requestUrl.includes('/upload') ||
      requestUrl.includes('/cover-art') ||
      requestUrl.includes('profile-picture')

    if (isStorageError) {
      return 'Storage service temporarily unavailable. Please try again later or contact support if the issue persists.'
    }
    return 'Server error occurred. Please try again later.'
  }

  //check for 503
  if (error.response?.status === 503) {
    return 'Service temporarily unavailable. Please try again in a few moments.'
  }

  //check for timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'Request timed out. Please check your connection and try again.'
  }

  //check for quota/limit errors
  if (error.response?.status === 413) {
    return 'File too large or storage quota exceeded.'
  }

  if (error.response?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }

  //check for authentication errors
  if (error.response?.status === 401) {
    return 'Authentication failed. Please log in again.'
  }

  //check for permission errors
  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.'
  }

  //check for not found errors
  if (error.response?.status === 404) {
    return 'The requested resource was not found.'
  }

  //default to any provided error message
  return error.response?.data?.detail || error.response?.data?.message || error.message || defaultMessage
}

/**
 * check if retryable
 * @param {Error} error
 * @returns {boolean} true if the error is retryable
 */
export function isRetryableError(error) {
  return (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.message?.includes('Network Error') ||
    error.response?.status === 500 ||
    error.response?.status === 503
  )
}

/**
 * check if connection/network issue
 * @param {Error} error
 * @returns {boolean}true if error is connection issue
 */
export function isConnectionError(error) {
  return (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.message?.includes('Network Error') ||
    error.message?.includes('timeout')
  )
}