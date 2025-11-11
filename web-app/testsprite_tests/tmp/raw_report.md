
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** GOLFFOX
- **Date:** 2025-11-11
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** user login endpoint validation
- **Test Code:** [TC001_user_login_endpoint_validation.py](./TC001_user_login_endpoint_validation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/978beee3-b5b9-4e16-bdcf-b9c8a6f397d3/4bc6628c-1d0b-412f-b0fc-99ee44a13fcf
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** vehicle deletion or archival with trip validation
- **Test Code:** [TC002_vehicle_deletion_or_archival_with_trip_validation.py](./TC002_vehicle_deletion_or_archival_with_trip_validation.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 128, in <module>
  File "<string>", line 57, in test_vehicle_deletion_or_archival_with_trip_validation
  File "<string>", line 45, in create_test_vehicle
Exception: Failed to create test vehicle: 404 <!DOCTYPE html><html lang="pt-BR"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/app/layout.css?v=1762900674880" data-precedence="next_static/css/app/layout.css"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack.js?v=1762900674880"/><script src="/_next/static/chunks/main-app.js?v=1762900674880" async=""></script><script src="/_next/static/chunks/app-pages-internals.js" async=""></script><script src="/_next/static/chunks/app/layout.js" async=""></script><meta name="robots" content="noindex"/><title>404: This page could not be found.</title><title>GOLF FOX - Gestão de Frotas</title><meta name="description" content="Plataforma de gestão de frotas e transporte"/><script src="/_next/static/chunks/polyfills.js" noModule=""></script></head><body class="__className_5c4a2f"><div hidden=""><!--$--><!--/$--></div><div style="font-family:system-ui,&quot;Segoe UI&quot;,Roboto,Helvetica,Arial,sans-serif,&quot;Apple Color Emoji&quot;,&quot;Segoe UI Emoji&quot;;height:100vh;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center"><div><style>body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}</style><h1 class="next-error-h1" style="display:inline-block;margin:0 20px 0 0;padding:0 23px 0 0;font-size:24px;font-weight:500;vertical-align:top;line-height:49px">404</h1><div style="display:inline-block"><h2 style="font-size:14px;font-weight:400;line-height:49px;margin:0">This page could not be found.</h2></div></div></div><!--$--><!--/$--><div data-rht-toaster="" style="position:fixed;z-index:9999;top:16px;left:16px;right:16px;bottom:16px;pointer-events:none"></div><!--$--><!--/$--><script src="/_next/static/chunks/webpack.js?v=1762900674880" id="_R_" async=""></script><script>(self.__next_f=self.__next_f||[]).push([0])</script><script>self.__next_f.push([1,"5:I[\"(app-pages-browser)/./node_modules/next/dist/next-devtools/userspace/app/segment-explorer-node.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"SegmentViewNode\"]\n7:\"$Sreact.fragment\"\n16:I[\"(app-pages-browser)/./components/error-boundary.tsx\",[\"app/layout\",\"static/chunks/app/layout.js\"],\"ErrorBoundary\"]\n18:I[\"(app-pages-browser)/./components/web-vitals-init.tsx\",[\"app/layout\",\"static/chunks/app/layout.js\"],\"WebVitalsInit\"]\n1a:I[\"(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"\"]\n1c:I[\"(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"\"]\n1f:I[\"(app-pages-browser)/./node_modules/react-hot-toast/dist/index.mjs\",[\"app/layout\",\"static/chunks/app/layout.js\"],\"Toaster\"]\n21:I[\"(app-pages-browser)/./node_modules/@vercel/speed-insights/dist/next/index.mjs\",[\"app/layout\",\"static/chunks/app/layout.js\"],\"SpeedInsights\"]\n34:I[\"(app-pages-browser)/./node_modules/next/dist/lib/framework/boundary-components.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"OutletBoundary\"]\n3b:I[\"(app-pages-browser)/./node_modules/next/dist/client/components/metadata/async-metadata.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"AsyncMetadataOutlet\"]\n44:I[\"(app-pages-browser)/./node_modules/next/dist/lib/framework/boundary-components.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"ViewportBoundary\"]\n4a:I[\"(app-pages-browser)/./node_modules/next/dist/lib/framework/boundary-components.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"MetadataBoundary\"]\n4f:\"$Sreact.suspense\"\n53:I[\"(app-pages-browser)/./node_modules/next/dist/client/components/builtin/global-error.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"\"]\n:HL[\"/_next/static/css/app/layout.css?v=1762900674880\",\"style\"]\n:N1762900674891.4456\n3:\"$EObject.defineProperty(()=\u003e{ct"])</script><script>self.__next_f.push([1,"x.componentMod.preloadStyle(fullHref,ctx.renderOpts.crossOrigin,ctx.nonce)},\\\"name\\\",{value:\\\"\\\"})\"\n2:{\"name\":\"Preloads\",\"key\":null,\"env\":\"Server\",\"stack\":[],\"props\":{\"preloadCallbacks\":[\"$3\"]}}\n4:[]\n6:[]\n8:[[\"Array.map\",\"\",0,0,0,0,false]]\nb:I[\"(app-pages-browser)/./node_modules/next/dist/client/components/layout-router.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"\"]\ne:I[\"(app-pages-browser)/./node_modules/next/dist/client/components/render-from-template-context.js\",[\"app-pages-internals\",\"static/chunks/app-pages-internals.js\"],\"\"]\nf:{}\n10:[[\"Function.all\",\"\",0,0,0,0,true]]\nd:{\"children\":[\"$\",\"$Le\",null,\"$f\",null,\"$10\",1]}\n11:[[\"Function.all\",\"\",0,0,0,0,true]]\nc:{\"parallelRouterKey\":\"children\",\"error\":\"$undefined\",\"errorStyles\":\"$undefined\",\"errorScripts\":\"$undefined\",\"template\":[\"$\",\"$7\",null,\"$d\",null,\"$11\",0],\"templateStyles\":\"$undefined\",\"templateScripts\":\"$undefined\",\"notFound\":\"$undefined\",\"forbidden\":\"$undefined\",\"unauthorized\":\"$undefined\",\"segmentViewBoundaries\":\"$Y\"}\n12:[[\"Function.all\",\"\",0,0,0,0,true]]\na:{\"name\":\"RootLayout\",\"key\":null,\"env\":\"Server\",\"stack\":[],\"props\":{\"children\":[\"$\",\"$Lb\",null,\"$c\",null,\"$12\",1],\"params\":\"$Y\"}}\n13:[[\"RootLayout\",\"webpack-internal:///(rsc)/./app/layout.tsx\",27,87,26,1,false]]\n14:[[\"RootLayout\",\"webpack-internal:///(rsc)/./app/layout.tsx\",29,94,26,1,false]]\n15:[[\"RootLayout\",\"webpack-internal:///(rsc)/./app/layout.tsx\",31,98,26,1,false]]\n17:[[\"RootLayout\",\"webpack-internal:///(rsc)/./app/layout.tsx\",33,96,26,1,false]]\n19:[[\"Function.all\",\"\",0,0,0,0,true]]\n1b:[[\"Function.all\",\"\",0,0,0,0,true]]\n1d:[[\"Function.all\",\"\",0,0,0,0,true]]\n1e:[[\"RootLayout\",\"webpack-internal:///(rsc)/./app/layout.tsx\",39,96,26,1,false]]\n20:[[\"RootLayout\",\"webpack-internal:///(rsc)/./app/layout.tsx\",46,96,26,1,false]]\n22:[[\"Function.all\",\"\",0,0,0,0,true]]\n23:[[\"Function.all\",\"\",0,0,0,0,true],[\"Function.all\",\"\",0,0,0,0,true]]\n24:[[\"Function.all\",\"\",0,0,0,0,true],[\"Function.all\",\"\",0,0,0,0,true]]\n25:[[\"Function.all\",\"\",0,0,0,0,true],[\"Function.all\",\"\",0,0,0,0,true]]\n26:[[\"F"])</script><script>self.__next_f.push([1,"unction.all\",\"\",0,0,0,0,true],[\"Function.all\",\"\",0,0,0,0,true]]\n28:{\"name\":\"NotFound\",\"key\":null,\"env\":\"Server\",\"stack\":[[\"Function.all\",\"\",0,0,0,0,true],[\"Function.all\",\"\",0,0,0,0,true]],\"props\":{\"params\":\"$@29\",\"searchParams\":\"$@2a\"}}\n2b:{\"name\":\"HTTPAccessErrorFallback\",\"key\":null,\"env\":\"Server\",\"owner\":\"$28\",\"stack\":[],\"props\":{\"status\":404,\"message\":\"This page could not be found.\"}}\n2c:[]\n2d:[]\n2e:[]\n2f:[]\n30:[]\n31:[]\n32:[]\n33:[[\"Function.all\",\"\",0,0,0,0,true],[\"Function.all\",\"\",0,0,0,0,true]]\n37:\"$EObject.defineProperty(async function getViewportReady() {\\n        await viewport();\\n        return undefined;\\n    },\\\"name\\\",{value:\\\"getViewportReady\\\"})\"\n36:{\"name\":\"__next_outlet_boundary__\",\"key\":null,\"env\":\"Server\",\"stack\":[[\"Function.all\",\"\",0,0,0,0,true],[\"Function.all\",\"\",0,0,0,0,true]],\"props\":{\"ready\":\"$37\"}}\n39:{\"name\":\"StreamingMetadataOutletImpl\",\"key\":null,\"env\":\"Server\",\"stack\":[[\"Function.all\",\"\",0,0,0,0,true],[\"Function.all\",\"\",0,0,0,0,true]],\"props\":{}}\n3a:[]\n3d:[]\n3f:{\"name\":\"NonIndex\",\"key\":null,\"env\":\"Server\",\"stack\":[],\"props\":{\"pagePath\":\"/_not-found\",\"statusCode\":404,\"isPossibleServerAction\":false}}\n40:[]\n42:{\"name\":\"ViewportTree\",\"key\":null,\"env\":\"Server\",\"stack\":[],\"props\":{}}\n43:[]\n46:{\"name\":\"__next_viewport_boundary__\",\"key\":null,\"env\":\"Server\",\"owner\":\"$42\",\"stack\":[],\"props\":{}}\n48:{\"name\":\"MetadataTree\",\"key\":null,\"env\":\"Server\",\"stack\":[],\"props\":{}}\n49:[]\n4c:{\"name\":\"__next_metadata_boundary__\",\"key\":null,\"env\":\"Server\",\"owner\":\"$48\",\"stack\":[],\"props\":{}}\n4d:[]\n4e:[]\n51:{\"name\":\"MetadataResolver\",\"key\":null,\"env\":\"Server\",\"owner\":\"$4c\",\"stack\":[],\"props\":{}}\n54:[]\n29:{}\n2a:\n55:[]\n56:[]\n57:[]\n58:[]\n1:D\"$2\"\n1:null\n9:D\"$a\"\n"])</script><script>self.__next_f.push([1,"9:[\"$\",\"html\",null,{\"lang\":\"pt-BR\",\"children\":[\"$\",\"body\",null,{\"className\":\"__className_5c4a2f\",\"children\":[\"$\",\"$L16\",null,{\"children\":[[\"$\",\"$L18\",null,{},\"$a\",\"$17\",1],[\"$\",\"$L1a\",null,{\"parallelRouterKey\":\"children\",\"error\":\"$undefined\",\"errorStyles\":\"$undefined\",\"errorScripts\":\"$undefined\",\"template\":[\"$\",\"$L1c\",null,{},null,\"$1b\",1],\"templateStyles\":\"$undefined\",\"templateScripts\":\"$undefined\",\"notFound\":\"$undefined\",\"forbidden\":\"$undefined\",\"unauthorized\":\"$undefined\",\"segmentViewBoundaries\":[\"$undefined\",\"$undefined\",\"$undefined\",[\"$\",\"$L5\",null,{\"type\":\"boundary:global-error\",\"pagePath\":\"__next_builtin__global-error.js\"},null,\"$1d\",1]]},null,\"$19\",1],[\"$\",\"$L1f\",null,{\"position\":\"top-right\"},\"$a\",\"$1e\",1],[\"$\",\"$L21\",null,{},\"$a\",\"$20\",1]]},\"$a\",\"$15\",1]},\"$a\",\"$14\",1]},\"$a\",\"$13\",1]\n"])</script><script>self.__next_f.push([1,"27:D\"$28\"\n27:D\"$2b\"\n"])</script><script>self.__next_f.push([1,"27:[[\"$\",\"title\",null,{\"children\":\"404: This page could not be found.\"},\"$2b\",\"$2c\",1],[\"$\",\"div\",null,{\"style\":{\"fontFamily\":\"system-ui,\\\"Segoe UI\\\",Roboto,Helvetica,Arial,sans-serif,\\\"Apple Color Emoji\\\",\\\"Segoe UI Emoji\\\"\",\"height\":\"100vh\",\"textAlign\":\"center\",\"display\":\"flex\",\"flexDirection\":\"column\",\"alignItems\":\"center\",\"justifyContent\":\"center\"},\"children\":[\"$\",\"div\",null,{\"children\":[[\"$\",\"style\",null,{\"dangerouslySetInnerHTML\":{\"__html\":\"body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}\"}},\"$2b\",\"$2f\",1],[\"$\",\"h1\",null,{\"className\":\"next-error-h1\",\"style\":{\"display\":\"inline-block\",\"margin\":\"0 20px 0 0\",\"padding\":\"0 23px 0 0\",\"fontSize\":24,\"fontWeight\":500,\"verticalAlign\":\"top\",\"lineHeight\":\"49px\"},\"children\":404},\"$2b\",\"$30\",1],[\"$\",\"div\",null,{\"style\":{\"display\":\"inline-block\"},\"children\":[\"$\",\"h2\",null,{\"style\":{\"fontSize\":14,\"fontWeight\":400,\"lineHeight\":\"49px\",\"margin\":0},\"children\":\"This page could not be found.\"},\"$2b\",\"$32\",1]},\"$2b\",\"$31\",1]]},\"$2b\",\"$2e\",1]},\"$2b\",\"$2d\",1]]\n"])</script><script>self.__next_f.push([1,"35:D\"$36\"\n38:D\"$39\"\n38:[\"$\",\"$L3b\",null,{\"promise\":\"$@3c\"},\"$39\",\"$3a\",1]\n3e:D\"$3f\"\n3e:[\"$\",\"meta\",null,{\"name\":\"robots\",\"content\":\"noindex\"},null,\"$40\",1]\n41:D\"$42\"\n45:D\"$46\"\n41:[[\"$\",\"$L44\",null,{\"children\":\"$L45\"},\"$42\",\"$43\",1],null]\n47:D\"$48\"\n4b:D\"$4c\"\n50:D\"$51\"\n4b:[\"$\",\"div\",null,{\"hidden\":true,\"children\":[\"$\",\"$4f\",null,{\"fallback\":null,\"children\":\"$L50\"},\"$4c\",\"$4e\",1]},\"$4c\",\"$4d\",1]\n47:[\"$\",\"$L4a\",null,{\"children\":\"$4b\"},\"$48\",\"$49\",1]\n52:[]\n"])</script><script>self.__next_f.push([1,"0:{\"P\":\"$1\",\"b\":\"development\",\"p\":\"\",\"c\":[\"\",\"api\",\"admin\",\"vehicles\"],\"i\":false,\"f\":[[[\"\",{\"children\":[\"/_not-found\",{\"children\":[\"__PAGE__\",{}]}]},\"$undefined\",\"$undefined\",true],[\"\",[\"$\",\"$L5\",\"layout\",{\"type\":\"layout\",\"pagePath\":\"layout.tsx\",\"children\":[\"$\",\"$7\",\"c\",{\"children\":[[[\"$\",\"link\",\"0\",{\"rel\":\"stylesheet\",\"href\":\"/_next/static/css/app/layout.css?v=1762900674880\",\"precedence\":\"next_static/css/app/layout.css\",\"crossOrigin\":\"$undefined\",\"nonce\":\"$undefined\"},null,\"$8\",0]],\"$9\"]},null,\"$6\",1]},null,\"$4\",0],{\"children\":[\"/_not-found\",[\"$\",\"$7\",\"c\",{\"children\":[null,[\"$\",\"$L1a\",null,{\"parallelRouterKey\":\"children\",\"error\":\"$undefined\",\"errorStyles\":\"$undefined\",\"errorScripts\":\"$undefined\",\"template\":[\"$\",\"$L1c\",null,{},null,\"$24\",1],\"templateStyles\":\"$undefined\",\"templateScripts\":\"$undefined\",\"notFound\":\"$undefined\",\"forbidden\":\"$undefined\",\"unauthorized\":\"$undefined\",\"segmentViewBoundaries\":[\"$undefined\",\"$undefined\",\"$undefined\",\"$undefined\"]},null,\"$23\",1]]},null,\"$22\",0],{\"children\":[\"__PAGE__\",[\"$\",\"$7\",\"c\",{\"children\":[[\"$\",\"$L5\",\"c-page\",{\"type\":\"page\",\"pagePath\":\"__next_builtin__not-found.js\",\"children\":\"$27\"},null,\"$26\",1],null,[\"$\",\"$L34\",null,{\"children\":[\"$L35\",\"$38\"]},null,\"$33\",1]]},null,\"$25\",0],{},null,false]},null,false]},null,false],[\"$\",\"$7\",\"h\",{\"children\":[\"$3e\",\"$41\",\"$47\"]},null,\"$3d\",0],false]],\"m\":\"$W52\",\"G\":[\"$53\",[\"$\",\"$L5\",\"ge-svn\",{\"type\":\"global-error\",\"pagePath\":\"__next_builtin__global-error.js\",\"children\":[]},null,\"$54\",0]],\"s\":false,\"S\":false}\n"])</script><script>self.__next_f.push([1,"45:[[\"$\",\"meta\",\"0\",{\"charSet\":\"utf-8\"},\"$36\",\"$55\",0],[\"$\",\"meta\",\"1\",{\"name\":\"viewport\",\"content\":\"width=device-width, initial-scale=1\"},\"$36\",\"$56\",0]]\n35:null\n3c:{\"metadata\":[[\"$\",\"title\",\"0\",{\"children\":\"GOLF FOX - Gestão de Frotas\"},\"$39\",\"$57\",0],[\"$\",\"meta\",\"1\",{\"name\":\"description\",\"content\":\"Plataforma de gestão de frotas e transporte\"},\"$39\",\"$58\",0]],\"error\":null,\"digest\":\"$undefined\"}\n50:\"$3c:metadata\"\n"])</script></body></html>

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/978beee3-b5b9-4e16-bdcf-b9c8a6f397d3/1ea18797-4cce-46e8-a875-1dc100a67ab8
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** generate optimized route stops
- **Test Code:** [TC003_generate_optimized_route_stops.py](./TC003_generate_optimized_route_stops.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 47, in <module>
  File "<string>", line 23, in test_generate_optimized_route_stops
AssertionError: Set VALID_ROUTE_ID to an actual existing route UUID before running this test.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/978beee3-b5b9-4e16-bdcf-b9c8a6f397d3/83ba4d35-00c0-4c20-b146-f582dd095894
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** create new operator user
- **Test Code:** [TC004_create_new_operator_user.py](./TC004_create_new_operator_user.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 69, in <module>
  File "<string>", line 59, in test_create_new_operator_user
AssertionError: Unexpected status code: 404 - Content: {"error":"Empresa não encontrada com o company_id fornecido"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/978beee3-b5b9-4e16-bdcf-b9c8a6f397d3/d33fe073-cefa-4dc4-a389-4447d668e321
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** manual cost entry creation and retrieval
- **Test Code:** [TC005_manual_cost_entry_creation_and_retrieval.py](./TC005_manual_cost_entry_creation_and_retrieval.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 135, in <module>
  File "<string>", line 52, in test_manual_cost_entry_creation_and_retrieval
AssertionError: Expected 201 Created but got 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/978beee3-b5b9-4e16-bdcf-b9c8a6f397d3/1770f125-801b-47cc-9e9a-132496d301a9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** create employee as operator
- **Test Code:** [TC006_create_employee_as_operator.py](./TC006_create_employee_as_operator.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 77, in <module>
  File "<string>", line 38, in test_create_employee_as_operator
AssertionError: Expected 201, got 500

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/978beee3-b5b9-4e16-bdcf-b9c8a6f397d3/2c8ddc24-688f-438e-ab75-415132ab6972
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** optimize route for operator
- **Test Code:** [TC007_optimize_route_for_operator.py](./TC007_optimize_route_for_operator.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 45, in <module>
  File "<string>", line 41, in test_optimize_route_for_operator
AssertionError: Optimize route failed with status code 400

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/978beee3-b5b9-4e16-bdcf-b9c8a6f397d3/d2b7e0e4-0ebc-4855-8318-4a0557e69b11
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** generate report on demand
- **Test Code:** [TC008_generate_report_on_demand.py](./TC008_generate_report_on_demand.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/978beee3-b5b9-4e16-bdcf-b9c8a6f397d3/8e6cf74b-b270-49df-82d7-dea719a77a43
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** cron job to dispatch scheduled reports
- **Test Code:** [TC009_cron_job_to_dispatch_scheduled_reports.py](./TC009_cron_job_to_dispatch_scheduled_reports.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/978beee3-b5b9-4e16-bdcf-b9c8a6f397d3/ce82add0-da51-437e-bcba-848ae270d19f
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** system health check endpoint
- **Test Code:** [TC010_system_health_check_endpoint.py](./TC010_system_health_check_endpoint.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/978beee3-b5b9-4e16-bdcf-b9c8a6f397d3/9dadfd87-8d29-41ae-91d4-eaa33896d8b1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **40.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---