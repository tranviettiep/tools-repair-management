const fs = require('fs');

let apiJs = fs.readFileSync('js/api.js', 'utf8');

const originalMockRequest = `  async _mockRequest(action, params) {
    this._initMockData();`;

const fixedMockRequest = `  async _mockRequest(action, params) {
    try {
      this._initMockData();`;

if (apiJs.includes(originalMockRequest) && !apiJs.includes('try {\\n      this._initMockData();')) {
    apiJs = apiJs.replace(originalMockRequest, fixedMockRequest);
    // Find the end of _mockRequest. It ends with:
    //       default:
    //         return { success: false, error: \`Unknown action: \${action}\` };
    //     }
    //   }
    // };
    const endOfMock = `      default:
        return { success: false, error: \`Unknown action: \${action}\` };
    }
  }`;
    const fixedEndOfMock = `      default:
        return { success: false, error: \`Unknown action: \${action}\` };
    }
    } catch (err) {
      console.error("Mock API Error:", err);
      return { success: false, error: err.message || "Lỗi xử lý Mock API" };
    }
  }`;
    apiJs = apiJs.replace(endOfMock, fixedEndOfMock);
    fs.writeFileSync('js/api.js', apiJs, 'utf8');
}
console.log('Added try-catch to mockRequest');
