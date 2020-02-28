/* eslint-disable no-console, import/max-dependencies */
import webpack, { Configuration } from 'webpack';
import { loader } from 'webpack-loader-helper';
import nodeExternals from 'webpack-node-externals';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import chalk from 'chalk';
import ProgressBarPlugin from 'progress-bar-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const pollInterval = 1000;
const defaultOptions = {
    test: false,
    coverage: false,
    prod:
        process.argv.indexOf('--mode=production') !== -1 ||
        process.argv.indexOf('--env.prod') !== -1,
    get dev(): boolean {
        return !this.prod;
    },
    get mode() {
        return this.prod ? 'production' : 'development';
    },
    devtool: 'inline-cheap-module-source-map',
};

type ConfigOptions = Partial<Record<keyof typeof defaultOptions, any>>;

export default (options: ConfigOptions = {}): Configuration => {
    options = { ...defaultOptions, ...options };
    for (const [key, value] of Object.entries(options)) {
        value === true
            ? process.stdout.write(`${key} `)
            : process.stdout.write(value ? `${key}:${value} ` : '');
    }
    return {
        entry: [`webpack/hot/poll?${pollInterval}`, './src/main.ts'],
        watch: true,
        target: 'node',
        devtool: options.devtool,
        output: {
            path: `${__dirname}/dist`,
            filename: 'main.js',
        },
        mode: options.mode,
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            plugins: [new TsconfigPathsPlugin({})],
        },
        externals: [
            nodeExternals({ whitelist: [`webpack/hot/poll?${pollInterval}`] }),
        ],
        module: {
            rules: [
                {
                    test: /.tsx?$/,
                    exclude: /node_modules/,
                    use: [
                        loader('ts', {
                            transpileOnly: true,
                            compilerOptions: {},
                        }),
                    ],
                },
            ],
        },
        plugins: [
            new webpack.HotModuleReplacementPlugin(),
            new webpack.WatchIgnorePlugin([/\.js$/, /\.d\.ts$/]),
            new ProgressBarPlugin({
                format:
                    chalk.hex('#6c5ce7')('build ') +
                    chalk.hex('#0984e3')('▯:bar▯ ') +
                    // chalk.red('▯ :bar ▯ ') +
                    chalk.hex('#00b894')('(:percent) ') +
                    // chalk.green(':percent ') +
                    chalk.hex('#ffeaa7')(':msg'),
                // chalk.blue('( :elapsed s )')
                complete: '▰',
                incomplete: '▱',
                clear: false,
            }),
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                analyzerHost: '127.0.0.1',
                analyzerPort: 8888,
                reportFilename:
                    process.env.NODE_ENV === 'development' && 'report.html',
                openAnalyzer: false,
                generateStatsFile: false,
                statsFilename: 'stats.json',
            }),
            new webpack.BannerPlugin({
                banner: 'require("source-map-support").install();',
                raw: true,
                entryOnly: false,
            }),
            new webpack.EnvironmentPlugin({
                PROGRAM: 'webpack',
                NODE_ENV: options.mode,
            }),
        ],
        optimization: {
            removeAvailableModules: false,
            removeEmptyChunks: false,
            splitChunks: false,
        },
    };
};
