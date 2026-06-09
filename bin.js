#!/usr/bin/env node

const goodbye = require('graceful-goodbye')
const idEnc = require('hypercore-id-encoding')
const HyperInstrument = require('hyper-instrument')
const { command, flag, arg } = require('paparam')
const pino = require('pino')

const version = require('./package.json').version
const HttpDhtProxy = require('.')

const DEFAULT_PORT = 8080
const LOG_LEVELS = ['error', 'warn', 'info', 'debug']
const DEFAULT_LOG_LEVEL = 'info'
const SERVICE_NAME = 'http-dht-proxy'

const cmd = command(
  'http-dht-proxy',
  flag('--log-level|-l <logLevel>', 'Log level').choices(LOG_LEVELS).default(DEFAULT_LOG_LEVEL),
  flag('--scraper-public-key <scraperPublicKey>', 'Public key of a dht-prometheus scraper'),
  flag('--scraper-secret <scraperSecret>', 'Secret of the dht-prometheus scraper'),
  flag('--scraper-alias <scraperAlias>', '(Optional) Alias of scraper service'),
  flag('--bootstrap <bootstrap>', 'Bootstrap nodes').hide(),
  arg('[port]', 'Port to listen on'),
  async ({ flags, args }) => {
    const { logLevel, scraperPublicKey, scraperSecret, scraperAlias } = flags
    const bootstrap = flags.bootstrap ? JSON.parse(flags.bootstrap) : undefined
    const port = args.port ? +args.port : DEFAULT_PORT

    const logger = pino({ level: logLevel })

    const proxy = new HttpDhtProxy(port, { bootstrap })
    goodbye(async () => {
      await proxy.close()
      logger.info('HTTP-to-DHT proxy stopped')
    })

    proxy.on('server-error', ({ error }) => {
      logger.error(`Server error ${error}`)
    })
    proxy.on('connection-error-invalid-host', ({ host, error }) => {
      logger.warn(`Connection error - invalid host ${host}: ${error}`)
    })
    proxy.on('connection-error-dht', ({ host, dhtPublicKey, error }) => {
      logger.warn(
        `Connection error - DHT connection failed for host ${host} with public key ${dhtPublicKey}: ${error}`
      )
    })
    proxy.on('server-error-close', ({ error }) => {
      logger.warn(`Server close error: ${error}`)
    })
    proxy.on('listening', ({ port }) => {
      logger.info(`HTTP-to-DHT proxy on ${port}`)
    })

    await proxy.ready()
    logger.info('HTTP-to-DHT proxy started')

    if (scraperPublicKey && scraperSecret) {
      const instrumentation = new HyperInstrument({
        dht: proxy.dht,
        scraperPublicKey,
        scraperSecret,
        prometheusServiceName: SERVICE_NAME,
        prometheusAlias:
          scraperAlias || `${SERVICE_NAME}-${idEnc.normalize(proxy.dht.defaultKeyPair.publicKey)}`,
        version
      })
      goodbye(() => instrumentation.close())
      proxy.registerMetrics(instrumentation.promClient)
      instrumentation.registerLogger(logger)
      await instrumentation.ready()
    }
  }
)

cmd.parse()
