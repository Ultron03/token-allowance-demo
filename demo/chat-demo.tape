# Records demo/token-allowance.gif: alice gets three answers, then HTTP 429, while bob still gets through.
# Run from the project root with Ollama running and port 8080 free:  vhs demo/chat-demo.tape

Output demo/token-allowance.gif

Require curl
Require java

Set Shell "bash"
Set FontSize 22
Set Width 1380
Set Height 900
Set Padding 24
Set Theme "Catppuccin Mocha"
Set WindowBar Colorful
Set TypingSpeed 35ms

# Build and start the app off camera, with short answers and a small budget so the limit is hit quickly.
Hide
Type "./mvnw -q -DskipTests package && export CURL_HOME=$PWD/demo"
Enter
Wait@180s
Type "java -jar target/token-allowance-demo-0.0.1-SNAPSHOT.jar --spring.ai.ollama.chat.options.num-predict=60 --token-allowance.limits[0].scope=user --token-allowance.limits[0].window=daily --token-allowance.limits[0].max-tokens=200 > /tmp/token-allowance-demo.log 2>&1 &"
Enter
Type "until curl -o /dev/null localhost:8080 -w ''; do sleep 1; done; clear"
Enter
Wait@120s
Show

Type "# alice has a daily budget of 200 tokens"
Enter
Sleep 1s

Type "curl localhost:8080/chat -H 'X-User-Id: alice' -d 'Tell me a one-line joke about robots.'"
Enter
Wait@60s
Sleep 2s

Type "curl localhost:8080/chat -H 'X-User-Id: alice' -d 'One-line fun fact about octopuses.'"
Enter
Wait@60s
Sleep 2s

Type "curl localhost:8080/chat -H 'X-User-Id: alice' -d 'Describe Java in one short sentence.'"
Enter
Wait@60s
Sleep 2s

Type "curl localhost:8080/chat -H 'X-User-Id: alice' -d 'Tell me a one-line joke about cats.'"
Enter
Wait@60s
Sleep 3s

Type "# bob has a separate budget"
Enter
Sleep 1s

Type "curl localhost:8080/chat -H 'X-User-Id: bob' -d 'Tell me a one-line joke about cats.'"
Enter
Wait@60s
Sleep 4s

# Stop the app off camera.
Hide
Type "kill %1"
Enter
