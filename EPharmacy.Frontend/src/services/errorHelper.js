/**
 * Parses API error responses and returns a user-friendly error message
 * Handles both validation errors (RFC 9110 format) and plain text errors
 */
export const parseApiError = async (response, fallbackMessage = 'Operation failed') => {
  try {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      
      // Handle RFC 9110 validation error format
      if (errorData.errors && typeof errorData.errors === 'object') {
        const messages = [];
        for (const [field, fieldErrors] of Object.entries(errorData.errors)) {
          if (Array.isArray(fieldErrors)) {
            messages.push(...fieldErrors);
          } else {
            messages.push(`${field}: ${fieldErrors}`);
          }
        }
        return messages.join('\n');
      }
      
      // Handle simple error object with message/title
      if (errorData.message) return errorData.message;
      if (errorData.title) return errorData.title;
      if (typeof errorData === 'string') return errorData;
      
      return fallbackMessage;
    }
    
    // Handle plain text response
    const text = await response.text();
    return text || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};
