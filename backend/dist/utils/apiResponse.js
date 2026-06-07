export function success(data, message = "OK") {
    return {
        success: true,
        message,
        data,
    };
}
export function failure(message, code = "ERROR") {
    return {
        success: false,
        message,
        code,
    };
}
//# sourceMappingURL=apiResponse.js.map