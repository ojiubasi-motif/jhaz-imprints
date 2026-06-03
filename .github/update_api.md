{output_folder} = .results

{final_output_file} = /.github/context-api/api-instructions.md.

{new_features_updates_dir} = /.github/context-api/

{target} = /packages/api

You are assisting with updating the {final_output_file} and other files in {new_features_updates_dir}.
1. Open this repository on GitHub: https://github.com/bitovi/ai-enablement-prompts.
2. Navigate to the `/understanding-code/instruction-generation` folder within the repo.
3. Review all the prompt files in this folder WITHOUT executing them. 
    - This will help you understand the full scope of the prompt chain.
4. Confirm you have a full understanding of the prompt chain sequence.
5. Once you're familiar with the flow, begin making necessary changes to {new_features_updates_dir}.
6. Ensure changes are made following the prompts in numerical order:
    - 1-determine-techstack.md
    - 2-categorize-files.md
    - 3-identify-architecture.md
    - 4-domain-deep-dive.md
    - 5-styleguide-generation.md
    - 6-build-instructions.md
7. make changes ONLY to prompt files and sections that need it based on the new features/updates made in {target}. If a section is not affected by the new features/updates, do not modify it.
8. if you're unable to fetch the github repo, make reference to the files in {new_features_updates_dir} to get an idea of {target}, then review the codebase in {target} and reconcile with the prompt files in {new_features_updates_dir}.