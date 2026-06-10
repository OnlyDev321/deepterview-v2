package com.capstone.deepterview.domain.answer.controller;

import com.capstone.deepterview.domain.answer.dto.request.PythonAnalysisCallbackRequest;
import com.capstone.deepterview.domain.answer.service.PythonAnalysisCallbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Python 분석 콜백 컨트롤러")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/internal")
public class InternalAnalysisCallbackController {

    private final PythonAnalysisCallbackService pythonAnalysisCallbackService;

    @PostMapping("/analysis/callback")
    @Operation(
            summary = "Python 서버에서 호출하는 콜백 API",
            description = "Pyhton 서버에서 심층 분석이 완료되면 해당 API를 사용하여 분석 결과를 Spring 서버로 전송합니다."
    )
    public ResponseEntity<Void> receiveAnalysisResult(@RequestBody PythonAnalysisCallbackRequest request) {
        pythonAnalysisCallbackService.process(request);
        return ResponseEntity.ok().build();
    }
}
