# Records demo/agent-and-dollars.gif: streaming, the agent's call cap, and dollar budgets at real prices.
# Needs GEMINI_API_KEY in .env. Run from the project root with port 8080 free:  vhs demo/agent-demo.tape

Output demo/agent-and-dollars.gif

Require curl
Require java
Require jq

Set Shell "bash"
Set FontSize 20
Set Width 1400
Set Height 980
Set Padding 24
Set Theme "Catppuccin Mocha"
Set WindowBar Colorful
Set TypingSpeed 30ms

# Build and start the app off camera on Gemini 3.5 Flash-Lite, with dollar budgets at its published prices.
Hide
Type "./mvnw -q -DskipTests package && export CURL_HOME=$PWD/demo"
Enter
Wait@180s
Type "java -jar target/token-allowance-demo-0.0.1-SNAPSHOT.jar --spring.profiles.active=gemini,priced > /tmp/token-allowance-demo.log 2>&1 &"
Enter
Type "until curl -o /dev/null localhost:8080/actuator/health -w ''; do sleep 1; done; clear"
Enter
Wait@120s
Show

Type "# streamed answers are charged too"
Enter
Sleep 1s

Type "curl -N localhost:8080/chat/stream -u bob:bob -d 'Name three planets in one short sentence.'"
Enter
Wait@60s
Sleep 2s

Type "# the agent walks an org chart, one tool call per model call, at most 5 calls per request"
Enter
Sleep 1s

Type "curl localhost:8080/agent -u carol:carol -d 'Who is at the very top above dave? Use managerOf one step at a time.'"
Enter
Wait@120s
Sleep 3s

Type "curl localhost:8080/me/budget -u carol:carol -w '' | jq -c '.[0] | {maxCost, usedCost, costLeft}'"
Enter
Wait@30s
Sleep 3s

Type "clear"
Enter
Type "# dollar budgets: free users get $0.00025 a day at Gemini 3.5 Flash-Lite prices"
Enter
Sleep 1s

Type "curl localhost:8080/chat -u alice:alice -d 'One-line fun fact about octopuses.'"
Enter
Wait@60s
Sleep 1.5s

Type "curl localhost:8080/chat -u alice:alice -d 'One-line fun fact about owls.'"
Enter
Wait@60s
Sleep 1.5s

Type "curl localhost:8080/chat -u alice:alice -d 'One-line fun fact about bees.'"
Enter
Wait@60s
Sleep 1.5s

Type "curl localhost:8080/chat -u alice:alice -d 'One-line fun fact about the moon.'"
Enter
Wait@60s
Sleep 1.5s

Type "curl localhost:8080/chat -u alice:alice -d 'One-line fun fact about sharks.'"
Enter
Wait@60s
Sleep 2s

Type "curl localhost:8080/me/budget -u alice:alice -w '' | jq -c '.[0] | {maxCost, usedCost, costLeft}'"
Enter
Wait@30s
Sleep 2s

Type "# refused once less than one reserved answer is left: 60 tokens, about $0.00015"
Enter
Sleep 5s

# Stop the app off camera.
Hide
Type "kill %1"
Enter
