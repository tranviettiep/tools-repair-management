---
name: template-generate
description: >-
  Use this skill when the user wants to generate a new PDF export template for the Tools Repair Management system.
  It helps analyze a provided template file, determine field mappings (static, settings, or dynamic), and write the corresponding jsPDF code.
---

# Template Generate Skill

You are tasked with generating a PDF export function for the application using `jsPDF` and `jspdf-autotable`, based on a template provided by the user.

## Workflow

1. **Locate the Template:** The user will place a template file in the `template/` directory. If they just mention the name, look for it there.
2. **Analyze the Template:** 
   - Read the template file using `view_file` (if it's markdown, txt, or yaml).
   - If it's an image, use your multimodal capabilities to view the image if supported, or ask the user to describe the sections if you cannot.
3. **Ask for Clarification (The Interview):**
   - You **MUST** ask the user to clarify the fields found in the template. Group them into:
     - **Static/Settings fields:** Fields that rarely change (e.g., Company Name, Department, Signatures). These should be stored in `SettingsPage` or `localStorage`.
     - **Dynamic fields:** Fields generated automatically (e.g., Date, ID, Sequence).
     - **User Input fields:** Fields the user needs to manually type into a modal/form before clicking export.
4. **Implementation Plan:**
   - Write the UI code to add the necessary input fields to the corresponding modal (if any User Input fields are needed).
   - Write the `jsPDF` code to draw the template perfectly. Use `jsPDF-autotable` for tables. Ensure styling, font sizes, and layout match the provided template.
5. **Execute:** Modify the corresponding JS files (e.g., `external-repairs.js`, `reports.js`, or a new file) to implement the PDF generation function.
