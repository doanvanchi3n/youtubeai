package com.example.backend.exception;

import com.example.backend.dto.response.ErrorResponse;
import lombok.RequiredArgsConstructor;
import com.example.backend.service.SystemLogService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.stream.Collectors;

@ControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    
    private final SystemLogService systemLogService;
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), "NOT_FOUND");
    }
    
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), "BAD_REQUEST");
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        return buildResponse(HttpStatus.UNAUTHORIZED, ex.getMessage(), "UNAUTHORIZED");
    }
    
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(ForbiddenException ex) {
        return buildResponse(HttpStatus.FORBIDDEN, ex.getMessage(), "FORBIDDEN");
    }
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        // Kiểm tra nếu là lỗi authentication/authorization
        String message = ex.getMessage();
        if (message != null && (message.contains("Email") || message.contains("mật khẩu") 
                || message.contains("khóa") || message.contains("Token"))) {
            systemLogService.record("WARN", "backend", message, null);
            return buildResponse(HttpStatus.BAD_REQUEST, message, "AUTH_ERROR");
        }
        systemLogService.record("ERROR", "backend", message, ex.toString());
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, 
            message != null ? message : "Đã xảy ra lỗi hệ thống", "INTERNAL_ERROR");
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        systemLogService.record("ERROR", "backend", ex.getMessage(), ex.toString());
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Đã xảy ra lỗi hệ thống", "INTERNAL_ERROR");
    }
    
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  HttpHeaders headers,
                                                                  HttpStatusCode status,
                                                                  WebRequest request) {
        String message = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
        
        ErrorResponse errorResponse = new ErrorResponse("error", message, "VALIDATION_FAILED");
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    private ResponseEntity<ErrorResponse> buildResponse(HttpStatus status, String message, String code) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus("error");
        errorResponse.setMessage(message);
        errorResponse.setCode(code);
        return new ResponseEntity<>(errorResponse, status);
    }
}
