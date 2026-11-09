# Records demo/token-allowance.gif: user, plan and tenant budgets, and what is left.
# Run from the project root with Ollama running and port 8080 free:  vhs demo/chat-demo.tape

Output demo/token-allowance.gif

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

# Build and start the app off camera with the small budgets, so every limit is reached quickly.
Hide
Type "./mvnw -q -DskipTests package && export CURL_HOME=$PWD/demo"
Enter
Wait@180s
Type "java -jar target/token-allowance-demo-0.0.1-SNAPSHOT.jar --spring.profiles.active=small > /tmp/token-allowance-demo.log 2>&1 &"
Enter
Type "until curl -o /dev/null localhost:8080/actuator/health -w ''; do sleep 1; done; clear"
Enter
Wait@120s
Show

Type "# alice is on the free plan: 200 tokens a day"
Enter
Sleep 1s

Type "curl localhost:8080/chat -u alice:alice -d 'Tell me a one-line joke about robots.'"
Enter
Wait@60s
Sleep 1.5s

Type "curl localhost:8080/chat -u alice:alice -d 'One-line fun fact about octopuses.'"
Enter
Wait@60s
Sleep 1.5s

Type "curl localhost:8080/chat -u alice:alice -d 'Describe Java in one short sentence.'"
Enter
Wait@60s
Sleep 1.5s

Type "curl localhost:8080/chat -u alice:alice -d 'Tell me a one-line joke about cats.'"
Enter
Wait@60s
Sleep 3s

Type "clear"
Enter
Type "# bob has a budget of his own"
Enter
Sleep 1s

Type "curl localhost:8080/chat -u bob:bob -d 'Tell me a one-line joke about cats.'"
Enter
Wait@60s
Sleep 2s

Type "# carol is on the pro plan, but shares the acme tenant budget with alice"
Enter
Sleep 1s

Type "curl localhost:8080/chat -u carol:carol -d 'One-line fun fact about the moon.'"
Enter
Wait@60s
Sleep 1.5s

Type "curl localhost:8080/chat -u carol:carol -d 'One-line fun fact about bees.'"
Enter
Wait@60s
Sleep 3s

Type "clear"
Enter
Type "# what alice has left, for herself and for acme"
Enter
Sleep 1s

Type "curl localhost:8080/me/budget -u alice:alice -w '' | jq -c '.[] | {scope, usedTokens, tokensLeft}'"
Enter
Wait@30s
Sleep 4s

# Stop the app off camera.
Hide
Type "kill %1"
Enter
