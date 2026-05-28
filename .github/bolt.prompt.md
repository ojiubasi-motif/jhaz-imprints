{output_folder} = .results

{final_output_file} = /.github/context-bolt/bolt.prompt.md

You are assisting with generating a {final_output_file} file using a multi-step prompt chain. 

{target} = /apps/bolt
1. Open this repository on GitHub: https://github.com/bitovi/ai-enablement-prompts.
2. Navigate to the `/understanding-code/instruction-generation` folder within the repo.
3. Review all the prompt files in this folder WITHOUT executing them. 
    - This will help you understand the full scope of the prompt chain.
4. Confirm you have a full understanding of the prompt chain sequence.
5. Once you're familiar with the flow and the codebase in {target}, begin executing the prompts in numerical order:
    - 1-determine-techstack.md
    - 2-categorize-files.md
    - 3-identify-architecture.md
    - 4-domain-deep-dive.md
    - 5-styleguide-generation.md
    - 6-build-instructions.md
6. All output must be in `/.github/context-bolt` folder, For each step, output results into a corresponding `.github/context-bolt/{output_folder}/` folder.
    - Mirror the step’s filename e.g., `1-determine-techstack.md` > `.github/context-bolt/{output_folder}/1-determine-techstack.md`.
Stop ONLY when:
    - All `instruction-generation` steps are complete
    - A full `{final_output_file}` can be generated.