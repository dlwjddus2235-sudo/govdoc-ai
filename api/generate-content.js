export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { docType, formData } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ success: false, error: 'API 키가 설정되지 않았습니다. Vercel 환경변수에 ANTHROPIC_API_KEY를 추가하세요.' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: buildPrompt(docType, formData) }]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json({ success: true, content: parsed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

function buildPrompt(docType, d) {
  const isR = docType === 'report';
  const nm = isR ? '사업결과보고서' : '사업계획서';
  const struct = isR ? `{
  "summary":"결과 요약 3~4문장",
  "background":["배경1","배경2"],
  "phases":[{"phase":"1단계","period":"기간","owner":"담당","content":"내용"},{"phase":"2단계","period":"기간","owner":"담당","content":"내용"},{"phase":"3단계","period":"기간","owner":"담당","content":"내용"},{"phase":"완료","period":"종료월","owner":"주관","content":"완료 내용"}],
  "method":["방법1","방법2","방법3"],
  "achievementSummary":[{"value":"달성값1","label":"지표1"},{"value":"달성값2","label":"지표2"},{"value":"달성값3","label":"지표3"},{"value":"달성값4","label":"지표4"}],
  "kpiResults":[{"item":"KPI1","target":"목표","achieved":"달성","note":"비고"},{"item":"KPI2","target":"목표","achieved":"달성","note":"비고"},{"item":"KPI3","target":"목표","achieved":"달성","note":"비고"},{"item":"KPI4","target":"목표","achieved":"미달성","note":"사유"}],
  "quantResults":["정량1","정량2","정량3","정량4"],
  "qualResults":["정성1","정성2","정성3"],
  "detailResults":[{"title":"세부사업1 결과","details":["결과1","결과2","결과3"]},{"title":"세부사업2 결과","details":["결과1","결과2"]},{"title":"세부사업3 결과","details":["결과1","결과2"]}],
  "budgetSummary":["집행 요약1","집행 요약2"],
  "budgetItems":[{"item":"인건비","amount":"금액","ratio":"비율%","basis":"내역"},{"item":"사업운영비","amount":"금액","ratio":"비율%","basis":"내역"},{"item":"외주용역비","amount":"금액","ratio":"비율%","basis":"내역"},{"item":"관리비","amount":"금액","ratio":"비율%","basis":"내역"}],
  "issues":["문제1","문제2","문제3"],
  "solutions":["해결1","해결2"],
  "followUpPlan":["후속1","후속2"],
  "sustainability":["지속1","지속2","지속3"],
  "conclusion":"종합 의견 3~4문장",
  "futureEffect":["효과1","효과2","효과3"]
}` : `{
  "summary":"사업 요약 3~4문장",
  "background":["배경1","배경2","배경3"],
  "necessity":["필요성1","필요성2","필요성3","필요성4"],
  "vision":"비전 선언문 1문장",
  "objectives":["목표1","목표2","목표3","목표4"],
  "kpiPlan":[{"item":"KPI1","target":"목표치","achieved":"-","note":"비고"},{"item":"KPI2","target":"목표치","achieved":"-","note":"비고"},{"item":"KPI3","target":"목표치","achieved":"-","note":"비고"},{"item":"KPI4","target":"목표치","achieved":"-","note":"비고"}],
  "scope":["범위1","범위2"],
  "mainContents":[{"title":"세부사업1","details":["내용1","내용2","내용3"]},{"title":"세부사업2","details":["내용1","내용2","내용3"]},{"title":"세부사업3","details":["내용1","내용2"]}],
  "organization":["조직1","조직2"],
  "phases":[{"phase":"1단계","period":"기간1","owner":"담당1","content":"내용1"},{"phase":"2단계","period":"기간2","owner":"담당2","content":"내용2"},{"phase":"3단계","period":"기간3","owner":"담당3","content":"내용3"},{"phase":"완료","period":"종료월","owner":"주관기관","content":"완료 내용"}],
  "partners":["협력1","협력2"],
  "budgetOverview":["예산개요1","예산개요2"],
  "budgetItems":[{"item":"인건비","amount":"금액","ratio":"비율%","basis":"산출근거"},{"item":"사업운영비","amount":"금액","ratio":"비율%","basis":"산출근거"},{"item":"외주용역비","amount":"금액","ratio":"비율%","basis":"산출근거"},{"item":"관리비","amount":"금액","ratio":"비율%","basis":"산출근거"}],
  "achievementSummary":[{"value":"수치1","label":"지표1"},{"value":"수치2","label":"지표2"},{"value":"수치3","label":"지표3"},{"value":"수치4","label":"지표4"}],
  "quantResults":["정량1","정량2","정량3","정량4"],
  "qualResults":["정성1","정성2","정성3"],
  "utilization":["활용1","활용2"],
  "risks":["위험1","위험2","위험3"],
  "riskMitigation":["대응1","대응2"]
}`;

  return `당신은 대한민국 정부지원사업 전문 문서 작성가입니다. 아래 정보로 공식 ${nm}의 각 섹션을 전문적으로 작성하세요. 격식체(합니다체) 사용, 실제 정부 제출 수준으로 작성.

사업명: ${d.projectName}
주관기관: ${d.supervisor}
수행기관: ${d.orgName || '미입력'}
사업 분야: ${d.field || '미입력'}
사업기간: ${d.startDate} ~ ${d.endDate}
사업예산: ${d.budget}원
담당부서: ${d.department || '사업추진팀'}
목적·배경: ${d.purpose}
주요내용: ${d.mainContent}
KPI: ${d.kpi || '미입력'}
추가정보: ${d.additionalInfo || '없음'}

순수 JSON만 반환 (마크다운 없이):
${struct}`;
}
