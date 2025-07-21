import chalk from "chalk";
import log4js from "log4js";
import moment from "moment";
import strip_ansi from "strip-ansi";

const now_time = Date.now();

// 对齐配置
const LOG_ALIGN = {
    level_pad: 5,   // 日志级别固定长度
    name_pad: 15,  // 分类名称固定长度
    time_pad: 8    // 时间显示固定长度
};

/**
 * 填充字符串到固定长度（保持snake_case命名）
 * @param {string} str - 原始字符串
 * @param {number} len - 目标长度
 * @param {boolean} [right=false] - 是否右对齐
 * @returns {string} 填充后的字符串
 */
const pad_str = (str, len, right = false) => {
    const str_len = strip_ansi(str).length;  // 使用strip_ansi计算实际长度
    if (str_len >= len) return str;
    const padding = " ".repeat(len - str_len);
    return right ? padding + str : str + padding;
};

/**
 * 获取经过的时间（保持原有函数名）
 */
const t_elapsed = (fixed = 3) => pad_str(((Date.now() - now_time) / 1000).toFixed(fixed), LOG_ALIGN.time_pad, true);

// 日志级别配置
const LOG_LEVELS = {
    DEBUG: { color: chalk.blueBright, label: "DEBUG" },
    ERROR: { color: chalk.redBright, label: "ERROR" },
    INFO: { color: chalk.green, label: "INFO " }, // 保持5字符
    WARN: { color: chalk.yellow, label: "WARN " }  // 保持5字符
};

async function init_logger() {
    // 文件日志布局（确保移除所有ANSI颜色代码）
    log4js.addLayout("file_align", () => (log_event) => {
        const date = moment(log_event.startTime).format("YYYY-MM-DD HH:mm:ss");
        const level = pad_str(log_event.level.levelStr, LOG_ALIGN.level_pad);
        const name = pad_str(log_event.categoryName, LOG_ALIGN.name_pad);
        const message = strip_ansi(log_event.data.join(" "));  // 确保消息内容无颜色代码

        return `${date} | ${level} | ${name} | ${message}`;
    });

    // 控制台日志布局（带颜色）
    log4js.addLayout("console_align", () => (log_event) => {
        const straight_line = chalk.gray("|")

        const level_cfg = LOG_LEVELS[log_event.level.levelStr] ||
            { color: chalk.white, label: log_event.level.levelStr };
        const level_str = level_cfg.color(pad_str(level_cfg.label, LOG_ALIGN.level_pad));
        const name_str = chalk.cyan(pad_str(log_event.categoryName, LOG_ALIGN.name_pad));
        const time_str = chalk.magenta(`[${t_elapsed()}]`);
        const message = log_event.data.join(" ");

        return `${level_str} ${straight_line} ${name_str} ${straight_line} ${time_str} ${straight_line} ${message}`;
    });

    log4js.configure({
        appenders: {
            file: {
                type: "dateFile",
                filename: `logs/log_${moment().format("YYYY-MM-DD")}.log`,
                pattern: "yyyy-MM-dd",
                compress: true,
                layout: { type: "file_align" }
            },
            console: {
                type: "stdout",
                layout: { type: "console_align" }
            }
        },
        categories: {
            default: {
                appenders: ["file", "console"],
                level: "debug"
            }
        }
    });

    const logger = get_logger("Log System");
    logger.info("----------------------------------");
    logger.info("");
    logger.info("Log system initialized in " + chalk.green("[ " + (Date.now() - now_time) + "ms ]"));
    logger.info("");
    logger.info("----------------------------------");

}

function get_logger(name) {
    return log4js.getLogger(name);
}

export default Object.freeze({
    init_logger,
    get_logger
});