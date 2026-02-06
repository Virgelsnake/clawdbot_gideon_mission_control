---
auto_execution_mode: 0
description: ""
---
# Cascade Workflow Template: Generating a Product Requirements Document (PRD)

## Goal

To guide Cascade, the AI assistant in the host IDE, in creating a detailed and actionable Product Requirements Document (PRD) in Markdown format. This process ensures clarity for the development team, especially junior developers, by systematically gathering requirements before any code is written.

---

## The Process: Your Step-by-Step Instructions

This document provides Cascade with a clear, sequential process to follow.

**1. Receive the User's Initial Request:**
   - The user will provide a high-level description of a new application or feature they want to build.

**2. Determine the Target Platforms (Always First):**
   - **Before scoping or designing anything**, establish what platforms are in scope.
   - Ask the user the following question:

   > **"Which platforms are in scope for this work? (Select all that apply: 1) PWA (Web), 2) iOS, 3) Android)"**

   - If the user is unsure, propose a sensible default based on the context (e.g., PWA only for early validation; PWA + iOS/Android for a full consumer release) and ask them to confirm.

**3. Determine the Scope (Application vs. Feature):**
   - After confirming platforms, determine whether this is a new build or a change to an existing product.
   - Ask the user the following question:

   > **"Are we building a completely new application from scratch, or are we adding a new feature to an existing project?"**

   - The user's answer will determine which set of clarifying questions you ask next.

**4. Ask Tailored Clarifying Questions:**
   - Based on the user's answer in the previous step, proceed to ask questions from the appropriate section in the "Clarifying Questions Framework" below.
   - **Rule:** Always present options in a numbered or lettered list so the user can respond easily and precisely.
   - Keep questions user-friendly. If a topic is too technical for the user, propose a best-practice default and clearly mark it as an assumption in the PRD.

**5. Recommend a Tech Stack (Lead the Decision):**
   - If the user has not explicitly chosen a stack, recommend one based on the confirmed platforms and the context.
   - Provide:
     - one primary recommendation (with reasons and trade-offs), and
     - one or two viable alternatives.
   - Ask for confirmation of the recommendation before finalising the PRD.

**6. Review Provided Context Files:**
   - After receiving answers, review any context files the user has provided (e.g., `@draft_prd.md`, `@tech_specs.txt`).
   - Your goal is to extract relevant details to enrich the PRD and avoid asking redundant questions.

**7. Generate the PRD:**
   - Synthesise all the information from the initial prompt, the user's answers, your stack recommendation, and the context files.
   - Generate a comprehensive PRD using the **Standard PRD Structure** defined below.
   - Ensure the PRD supports a test-first delivery approach: acceptance criteria should map cleanly to tests, and tests should be written before feature implementation.

**8. Save the PRD:**
   - Save the generated document as `prd-[project-or-feature-name].md` inside a `/tasks` directory.

---

## Clarifying Questions Framework

### Always Ask (Regardless of Scope)

*   **Platforms:** "Which platforms are in scope? (PWA, iOS, Android)"
*   **Constraints (Plain English):** "Are there any hard constraints I must follow? (e.g., must be fully offline-capable, must integrate with an existing API, must be native iOS, must support older devices)"
*   **Success Definition:** "What does a successful first release look like to you? (1-3 bullet points)"

### If Building a **NEW APPLICATION**, ask questions about:

*   **Primary Goal:** "What is the main problem this application will solve for its users?"
*   **Target Audience:** "Who are the primary users of this application? (e.g., data analysts, project managers, general consumers)"
*   **Core Components:** "What are the 3-5 essential components or pages this application must have for its first version? (e.g., Dashboard, User Profile, Settings, Upload Page)"
*   **Key User Journey:** "Can you describe the most critical workflow a user will perform? (e.g., User logs in -> uploads a file -> sees a result on the dashboard)"
*   **Acceptance Criteria (MVP):** "How will we know the first version is working correctly? Please list the top 3-7 outcomes the user must be able to achieve."
*   **Success Metrics:** "How will we measure the success of this application? (e.g., number of daily active users, files processed per day)"
*   **Technology & Data:** "Are there any known technical constraints or specific data sources we need to consider?"

### If Adding a **NEW FEATURE**, ask questions about:

*   **User Story:** "Can you provide a user story for this feature? (e.g., As a [user type], I want to [action] so that I can [benefit].)"
*   **Specific Functionality:** "What are the key actions the user must be able to perform with this feature? Please list them."
*   **Acceptance Criteria:** "How will we know this feature is working correctly? What are the success criteria? (e.g., User can upload a CSV, the data is saved, the model is retrained)."
*   **Integration Points:** "Which existing parts of the application will this feature interact with or modify?"
*   **Scope & Boundaries (Non-Goals):** "To manage scope, are there any specific things this feature *should not* do?"
*   **Design & UI:** "Are there any existing UI mockups or design components we should use for this feature?"

---

## Standard PRD Structure

The generated PRD must include the following sections. Tailor the content to be more high-level for a new application and more specific for a feature.

1.  **Overview:** A brief description of the project/feature and the problem it solves.
2.  **Platforms & Release Targets:** What platforms are in scope (PWA/iOS/Android) and any known device/OS/browser targets. If unknown, propose reasonable defaults and mark them as assumptions.
3.  **Recommended Stack & Rationale:** Your recommended stack for the in-scope platforms (e.g., web framework choice; mobile approach such as React Native vs Flutter vs native), plus key trade-offs and why you chose it.
4.  **Goals:** A list of specific, measurable objectives.
5.  **User Stories & Personas:** Who this is for and how they will use it.
6.  **Functional Requirements:** A numbered list of the specific functionalities the system must have. (e.g., "1.1. The system must allow users to upload a CSV file.").
7.  **Acceptance Criteria & Test Strategy:** The acceptance criteria mapped to requirements, and the test approach (unit/integration/e2e) that will be written **before** feature implementation.
8.  **Definition of Done:** A checklist. **Mandatory:** tests pass for the implemented scope. Include any additional validation you ran (lint/type-check/build) where relevant.
9.  **Non-Goals (Out of Scope):** Clearly state what will not be included to manage expectations.
10. **Design Considerations (Optional):** Link to mockups, describe UI/UX requirements.
11. **Technical Considerations (Optional):** Mention known constraints, dependencies, integration points, and any key architectural notes.
12. **Implementation Notes (Non-binding):** Suggested modules/components, edge cases, sequencing, and any pragmatic guidance to help junior developers implement safely.
13. **Success Metrics:** How the success of the project/feature will be measured.
14. **Open Questions:** A list of any remaining questions for the project lead.
15. **Appendix: Source Notes (If Context Files Provided):** Briefly note which `@files` were used and the key facts extracted from each.

---

## Final Output

-   **Format:** Markdown (`.md`)
-   **Location:** A `/tasks` directory is recommended (so follow-on workflows can find it).
-   **Filename:** `prd-[project-or-feature-name].md`

---

## Summary of Your Instructions for Cascade

1.  Acknowledge the user's prompt.
2.  Ask which **platforms** are in scope (PWA/iOS/Android).
3.  Ask the user to clarify if you are building a **new application** or adding a **new feature**.
4.  Based on their response, ask the relevant set of **clarifying questions**.
5.  Wait for the user's answers.
6.  Recommend a tech stack (lead the decision) and confirm it with the user.
7.  Incorporate the user's answers and any information from provided context files.
8.  Generate the PRD in Markdown format using the structure defined above.
9.  Save the PRD file with the correct naming convention.
10. **Stop and wait for the next command.** If appropriate, suggest the next workflow step (e.g., generating a tasks file from the new PRD). Do not proceed with implementation.