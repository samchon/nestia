---
name: Bug report
about: Create a report to help us improve

---

## Bug Report
Note that, the bug you're reporting may have registered in the [issues](https://github.com/samchon/nestia/search?type=issues) by another user. Even the bug you're reporting may have been fixed in the `@next` version. In such reasons, I recommend you to check the old [issues](https://github.com/samchon/nestia/search?type=issues) and reproduct your code with the `@next` version before publishing the bug reporting issue.

```bash
`npm install --save-dev nestia@next`
```

When the same error occurs even in the `@next` version, then please fill the below template:

### Summary
Write a short summary of the bug in here.

  - **SDK Version**: 2.1.0-dev.20220505
  - **Expected behavior**: 
  - **Actual behavior**: 

Write detailed description in here.



### Code occuring the bug
```typescript
/* Demonstration code occuring the bug you're reporting */
```

Write the demonstration code occuring the bug you're reporting.

However, as the `nestia` is not a typical library who being used by the `import` statement but a executable program generating the SDK (Software Development Kit), it would be difficult to describe the bug with only the demonstration code.

In that case, you'd better to make a demonstration project occuring the bug to report. After the demonstration repository composition, fill the below `bash` script section. Of course, if you can describe the bug clearly, without the demonstration project construction, just skip it. Creating the demonstration repository is not essential.

```bash
git clone https://github.com/someone/nestia-bug-report-xxx
cd nestia-bug-report-xxx
npx nestia sdk
```