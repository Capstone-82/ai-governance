export interface GuardrailConfig {
    id: string;
    name: string;
}

export const GUARDRAILS: GuardrailConfig[] = [
    { name: 'PII Strict (Sensitive Data)', id: 'p3udqcktzebt' },
    { name: 'Harmful Content Filter', id: 'q4tq14jib2sw' },
    { name: 'Prompt Attack Protection', id: 't87q8q0rj4cu' },
    { name: 'Cloud Config Disclosure', id: 'q8uc2i24xahv' },
    { name: 'Code Restriction', id: 'aonnjphx4lvf' },
    { name: 'Admin Control', id: 'x7y66o2fnhrs' },
];
