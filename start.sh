cd ./front
nohup serve -s build -l tcp://0.0.0.0:80 & disown
cd ../back
nohup npm start & disown
cd ..