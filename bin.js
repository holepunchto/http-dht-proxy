#!/usr/bin/env node

const start = require('.')

const PORT = process.argv[2] || 8080

start(PORT)
