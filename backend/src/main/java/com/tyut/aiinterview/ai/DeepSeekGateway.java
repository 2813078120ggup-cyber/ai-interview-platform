package com.tyut.aiinterview.ai;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tyut.aiinterview.config.DeepSeekProperties;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class DeepSeekGateway {
    private final DeepSeekProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20)).build();

    public DeepSeekGateway(DeepSeekProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public String followUp(String originalQuestion, String answer) {
        return followUp(originalQuestion, answer, "big-tech");
    }

    public String followUp(String originalQuestion, String answer, String interviewerStyle) {
        String prompt = """
                你是一名有 8 年以上招聘经验的中国互联网公司资深技术面试官，正在进行正式模拟面试。
                你必须像真实面试官一样推进面试，而不是像老师、助手或聊天机器人。
                当前面试官风格：%s
                当前主问题：%s
                候选人刚刚的回答：%s

                请只输出下一句面试官要说的话，使用中文，控制在 20～80 字，并且只问一个问题。
                规则：
                1. 若回答正确但不完整，围绕一个具体技术点继续深挖，如原理、边界、复杂度、故障场景或实践经验。
                2. 若回答明显错误，简短指出需要澄清的方向，再提出一个更具体的问题；不要直接给出完整答案。
                3. 若候选人回答“不知道”“不清楚”或内容极少，降低一层难度，改问一个可回答的基础子问题或实际使用经验；绝不能要求候选人分析“我不知道”。
                4. 不要重复主问题、复述候选人原话，不要使用助手口吻。
                5. 不要评分、总结、鼓励、寒暄，也不要一次给出多个问题。
                6. 必须严格遵循当前面试官风格，但不能刻意表演或冒犯候选人。
                """.formatted(stylePrompt(interviewerStyle), originalQuestion, answer);
        return askText("你是专业面试官，严格执行用户给出的面试流程与输出规则。", prompt);
    }

    public String openingQuestion(String question) {
        return openingQuestion(question, "big-tech");
    }

    public String openingQuestion(String question, String interviewerStyle) {
        String instruction = "你是一名专业的中文 AI 面试官。围绕给定题目开始正式面试。只输出一句自然、具体的首个面试问题，不要解释题目、评分、寒暄或自我介绍。面试官风格：" + stylePrompt(interviewerStyle);
        return askText(instruction, question);
    }

    public JsonNode generateTrainingPlan(String reportContext) {
        String prompt = """
                请基于候选人的面试报告生成一份个性化训练计划。
                要求具体、可执行，重点补齐最低分能力项，不要空泛鼓励。

                报告数据：%s

                仅返回 JSON，不要使用 Markdown 或代码块：
                {
                  "priority":"当前最优先提升的一句话结论",
                  "durationDays":7,
                  "focusAreas":["最多4个训练重点"],
                  "dailyPlan":[{"day":1,"title":"训练主题","tasks":["2到3个具体任务"]}],
                  "recommendedBanks":["推荐题库或训练方向"],
                  "interviewDrills":["推荐模拟面试练习方式"],
                  "successCriteria":["完成训练后的可衡量标准"]
                }
                """.formatted(reportContext);
        return askJson("你是资深面试训练教练，擅长把评测报告转化为 7 天训练计划，输出必须是合法 JSON。", prompt);
    }

    public String interviewCoach(String conversation) {
        String instruction = """
                你是 InterviewOS 的 AI 面试教练，服务对象是正在准备技术、产品、运营或通用职场面试的候选人。
                你的任务是帮助用户理解面试问题、组织回答结构、发现知识盲点、进行一轮模拟追问，以及把经历表达得更清晰。
                必须使用中文，语气专业、直接、友善；优先给出可执行的框架、示例表达或练习步骤。
                不要冒充正在进行正式考核的面试官，不要虚构用户经历，不要声称能保证录用。
                当问题涉及代码、系统设计或专业知识时，先给思路和关键点，再用简短示例说明；不要只给结论。
                当用户要求代写、作弊或规避真实考核时，拒绝该部分，并转为提供学习与表达建议。
                单次回答控制在 300 个中文字符以内；如需追问，每次只问一个最关键的问题。
                """;
        return askText(instruction, conversation);
    }

    public JsonNode evaluateAnswer(String question, String referenceAnswer, String candidateAnswer) {
        String prompt = """
                请对一名候选人的单题面试回答进行严格、可解释、证据优先的评分。

                面试题：%s
                参考信息（可能为空，仅用于校准，不应直接泄露给候选人）：%s
                候选人回答：%s

                评分必须遵循以下分布，不要给“礼貌分”：
                - 0-20：未回答、答非所问、只说不知道/不会，或几乎没有有效信息。
                - 21-40：只给出零散关键词，明显缺少核心概念或结论大多错误。
                - 41-60：知道部分概念，但表达浅、缺少关键机制/边界/实践细节。
                - 61-75：回答基本正确，有结构，但深度、案例、边界意识或追问应对一般。
                - 76-85：回答较完整，能覆盖核心机制、适用场景、风险和实践经验。
                - 86-92：优秀回答，需要体现深度理解、准确术语、清晰推理和工程经验。
                - 93-100：专家级表现，只有在答案非常完整、深入且几乎无明显缺陷时才可使用。

                严格要求：
                - 普通正确回答通常不应超过 75 分。
                - 没有展开原因、边界、例子或实践经验的回答，即使方向正确也不应超过 70 分。
                - 空答、很短回答、套话、重复题目、只说“不知道/不会/不清楚”，必须低分。
                - 不要因为候选人语气礼貌、表达自信或文字较长而虚高。
                - 分数必须与回答内容证据对应，宁可偏严，不要偏松。

                评分标准：
                - professionalScore：专业知识的正确性、深度和边界意识。
                - expressionScore：表达是否清晰、结构化、准确。
                - logicScore：分析过程、论据与结论的逻辑性。
                - adaptabilityScore：场景应对、实践意识和问题拆解能力。
                - overallScore：本题综合表现，必须低于或接近四项能力的证据水平，不能机械地等于四项平均值。

                仅返回一个 JSON 对象，不要使用 Markdown 或代码块：
                {"professionalScore":0-100,"expressionScore":0-100,"logicScore":0-100,"adaptabilityScore":0-100,"overallScore":0-100,"comment":"不超过120字的具体中文评语，指出主要扣分原因"}
                """.formatted(question, blankToDefault(referenceAnswer, "无"), blankToDefault(candidateAnswer, "未提交任何回答"));
        return askJson("你是以严格著称的企业技术面试评测专家。评分必须保守、证据优先，输出必须是合法 JSON。", prompt);
    }

    public JsonNode generateReport(String evaluationContext) {
        String prompt = """
                根据以下一次模拟面试的逐题 AI 评测，撰写面向候选人的中文面试报告。
                只基于给出的评测证据，避免夸大或臆测。优势、待提升项和建议应具体可执行。

                逐题评测数据：%s

                仅返回一个 JSON 对象，不要使用 Markdown 或代码块：
                {"summary":"80到160字的综合结论","strengths":"2到3条优势，用换行分隔","weaknesses":"2到3条待提升项，用换行分隔","improvementSuggestions":"2到3条可执行建议，用换行分隔"}
                """.formatted(evaluationContext);
        return askJson("你是资深招聘评测顾问。根据证据生成客观、具体的候选人面试报告，输出必须是合法 JSON。", prompt);
    }

    private JsonNode askJson(String instruction, String content) {
        String reply = ask(instruction, content, true);
        try {
            String normalized = reply.trim().replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "");
            JsonNode result = objectMapper.readTree(normalized);
            if (!result.isObject()) throw new IllegalStateException("DeepSeek 返回的评测结果不是 JSON 对象");
            return result;
        } catch (IOException exception) {
            throw new IllegalStateException("DeepSeek 返回的评测结果不是合法 JSON", exception);
        }
    }

    private String askText(String instruction, String content) {
        return ask(instruction, content, false);
    }

    private String ask(String instruction, String content, boolean jsonOutput) {
        if (!properties.configured()) throw new IllegalStateException("未配置 DEEPSEEK_API_KEY 或未启用 app.deepseek.enabled");
        try {
            String payload = objectMapper.writeValueAsString(new Request(properties.model(), List.of(
                    new Message("system", instruction), new Message("user", content)),
                    jsonOutput ? new ResponseFormat("json_object") : null, jsonOutput ? 0.2 : 0.7));
            HttpRequest request = HttpRequest.newBuilder(URI.create(properties.baseUrl().replaceAll("/$", "") + "/chat/completions"))
                    .timeout(Duration.ofSeconds(90)).header("Authorization", "Bearer " + properties.apiKey()).header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload)).build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("DeepSeek API 请求失败（HTTP " + response.statusCode() + "）：" + response.body());
            }
            JsonNode result = objectMapper.readTree(response.body());
            String reply = result.path("choices").path(0).path("message").path("content").asText();
            if (reply.isBlank()) throw new IllegalStateException("DeepSeek 未返回有效内容");
            return reply;
        } catch (IOException exception) {
            throw new IllegalStateException("调用 DeepSeek API 失败", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("调用 DeepSeek API 被中断", exception);
        }
    }

    private String blankToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }

    private String stylePrompt(String style) {
        return switch (style == null ? "" : style.trim()) {
            case "gentle" -> "温和型：语气友好、降低压迫感，用引导式问题帮助候选人展开，但仍保持专业标准。";
            case "pressure" -> "压迫型：节奏更快、追问更尖锐，重点检验边界、漏洞和抗压表达，但不能羞辱候选人。";
            case "hr" -> "HR 综合面：关注动机、沟通、稳定性、团队协作、职业规划和行为事件。";
            case "project-deep" -> "项目深挖型：围绕项目背景、个人贡献、难点、取舍、数据结果和复盘持续追问。";
            case "campus-basic" -> "校招基础型：从基础概念和常见场景切入，适合应届生，问题清晰、难度逐步上升。";
            default -> "大厂技术面：标准正式、技术深挖，关注原理、复杂度、工程实践、异常场景和系统性思考。";
        };
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record Request(String model, List<Message> messages, @JsonProperty("response_format") ResponseFormat responseFormat,
                           Double temperature) {}
    private record Message(String role, String content) {}
    private record ResponseFormat(String type) {}
}
