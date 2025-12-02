#!/bin/bash
echo "Create sample processes via curl"
curl -X POST -H 'Content-Type: application/json' -d '{"pid":"P0","maximum":[7,5,3]}' http://localhost:5000/api/process/create
curl -X POST -H 'Content-Type: application/json' -d '{"pid":"P1","maximum":[3,2,2]}' http://localhost:5000/api/process/create
curl -X POST -H 'Content-Type: application/json' -d '{"pid":"P2","maximum":[9,0,2]}' http://localhost:5000/api/process/create
echo "Requests (try creating a deadlock scenario)"
curl -X POST -H 'Content-Type: application/json' -d '{"pid":"P0","request":[0,1,0],"mode":"immediate"}' http://localhost:5000/api/request
