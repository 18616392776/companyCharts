(function(global, undefined) {
    var extend = function(obj, properties) {
        if (!properties) return obj;
        for (var i in properties) {
            obj[i] = properties[i];
        }
    };
    global.Charts = Charts;

    var transferAngle = function(num) {
        return num / 360 * 2 * Math.PI;
    };
    var devicePixelRatio = global.devicePixelRatio;
    var transferDpi = function(num) {
        return num * devicePixelRatio;
    };


    var collTest = function(obj, target) {
        if (target.type === 'arc') {
            var x1 = obj.x;
            var y1 = obj.y;
            var x2 = target.x;
            var y2 = target.y;
            var r = target.r;
            return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) <= r;
        } else if (target.type === 'rect') {
            var x1 = obj.x;
            var y1 = obj.y;
            var x2 = target.x;
            var y2 = target.y;
            var w = target.x + target.width;
            var h = target.y + target.height;
            return !(x1 < x2 || x1 > w || y1 < y2 || y1 > h);
        }
    };

    var colors = ['#ffedd4', '#ffceaf', '#ffa500', '#ff5534', '#eef9ff', '#93d0ff', '#0091ff', '#000'];

    function Charts(canvasElement, config) {
        this.element = canvasElement;
        this.eventList = [];
        this.config = {
            dpi: devicePixelRatio
        };
        extend(this.config, config);
    }

    extend(Charts.prototype, {
        init: function() {
            this.context = this.element.getContext('2d');
            this.element.width = this.width = this.element.offsetWidth * this.config.dpi;
            this.element.height = this.height = this.element.offsetHeight * this.config.dpi;
            this.event = null;
            var _this = this;
            this.element.addEventListener('mousemove', function(ev) {
                var i = 0;
                var arr = _this.eventList;
                while (i < arr.length) {
                    if (collTest({
                        x: ev.pageX,
                        y: ev.pageY
                    }, arr[i])) {
                        _this.element.style.cursor = 'pointer';
                        _this.event = arr[i];
                        return;
                    }
                    i++;
                }
                _this.event = null;
                _this.element.style.cursor = 'inherit';
            }, false);
            this.element.addEventListener('click', function() {
                if (_this.event) {
                    _this.event.callback(_this.event.data);
                }
            }, false);
        },
        createPositionMap: function(data, opts) {
            var context = this.context;
            var options = {
                x: 0,
                y: 0,
                width: 300,
                height: 0,
                fontSize: 14,
                textWidth: 200,
                lineHeight: 20,
                verticalPadding: 8,
                marginBottom: 20
            };
            extend(options, opts);
            var getHeight = function(data, key) {
                data[key].forEach(function(item, index) {
                    //算单标签的高度
                    var textArr = [];
                    var t = '';
                    item.name.split(/\b/).forEach(function(item) {
                        if (/^\w/.test(item)) {
                            if (context.measureText(item).width > options.textWidth) {
                                textArr.push(item);
                                t = ''
                            } else if (context.measureText(t + item).width > options.textWidth) {
                                textArr.push(t);
                                t = item;
                            } else {
                                t += item;
                            }
                        } else {
                            for (var i = 0, len = item.length; i < len; i++) {
                                if (context.measureText(t).width > options.textWidth) {
                                    textArr.push(t);
                                    t = '';
                                }
                                t += item.charAt(i);
                            }
                        }
                    })
                    t && textArr.push(t);
                    item.$nameArr = textArr;
                    item.$height = (textArr.length - 1) * options.lineHeight + options.fontSize + options.verticalPadding;
                    if (item[key] && item[key].length) {
                        getHeight(item, key);
                    }
                })
            };
            getHeight(data, 'source');
            getHeight(data, 'target');




            var getBoxHeight = function(data, key) {
                var height = 0;
                if (data[key] && data[key].length) {
                    data[key].forEach(function(item, index) {
                        height += getBoxHeight(item, key);
                    })
                    height += (data[key].length - 1) * options.marginBottom;
                }
                data.$boxHeight = (data.$height > height ? data.$height : height);
                return data.$boxHeight;
            };


            getBoxHeight(data, 'source');
            getBoxHeight(data, 'target');


            var getY = function(data, key) {
                var n = 0;
                data[key].forEach(function(item, index) {
                    item.$y = n + index * options.marginBottom;
                    n += item.$boxHeight;
                    if (item[key] && item[key].length) {
                        getY(item, key);
                    }
                })
            }
            getY(data, 'target');
            getY(data, 'source');
        },
        button: function(opts, styles, isShow, data, callback) {
            var options = {
                x: 0,
                y: 0,
                r: 12,
                startAngle: 0,
                endAngle: 360,
                counterclockwise: false
            };
            var context = this.context;
            extend(context, styles);
            extend(options, opts);


            options.startAngle = transferAngle(options.startAngle);
            options.endAngle = transferAngle(options.endAngle);


            if (typeof callback === 'function') {
                this.eventList.push({
                    type: 'arc',
                    x: options.x,
                    y: options.y,
                    r: options.r,
                    data: data,
                    callback: callback
                });
            }

            context.beginPath();
            context.arc(
                options.x,
                options.y,
                options.r,
                options.startAngle,
                options.endAngle,
                options.counterclockwise
            );
            context.closePath();
            context.fill();
            context.stroke();
            if (!isShow) {
                context.clearRect(
                    options.x - 1,
                    options.y - options.r + 7,
                    2,
                    options.r * 2 - 14
                );
            }
            context.clearRect(
                options.x - options.r + 7,
                options.y - 1,
                options.r * 2 - 14,
                2
            );
        },
        group: function(opts, styles) {
            var options = {
                x: 0,
                y: 0,
                width: 200,
                height: 36,
                radius: 10
            };

            var context = this.context;
            extend(context, styles);
            extend(options, opts);

            context.beginPath();
            context.moveTo(
                options.x + options.radius,
                options.y
            );
            context.lineTo(
                options.x + options.width - options.radius,
                options.y
            );
            context.arcTo(
                options.x + options.width,
                options.y,
                options.x + options.width,
                options.y + options.radius,
                options.radius
            );
            context.lineTo(
                options.x + options.width,
                options.y + options.height - options.radius
            );
            context.arcTo(
                options.x + options.width,
                options.y + options.height,
                options.x + options.width - options.radius,
                options.y + options.height,
                options.radius
            );
            context.lineTo(
                options.x + options.radius,
                options.y + options.height
            );
            context.arcTo(
                options.x,
                options.y + options.height,
                options.x,
                options.y + options.height - options.radius,
                options.radius
            );
            context.lineTo(
                options.x,
                options.y + options.radius
            );
            context.arcTo(
                options.x,
                options.y,
                options.x + options.radius,
                options.y,
                options.radius
            );
            context.closePath();
            context.fill();
        },
        tag: function(obj, data) {
            var opts = obj.opts;
            var textArr = obj.textArr;
            var direction = obj.direction;
            var index = obj.index;
            var isShow = obj.isShow;
            var tagClickCallback = obj.tagClickCallback;
            var btnClickCallback = obj.btnClickCallback;


            var options = {
                x: 0,
                y: 0,
                height: 36,
                width: 300,
                lineHeight: 20,
                fontSize: 14,
                verticalPadding: 8
            };
            extend(options, opts);


            var context = this.context;
            context.font = context.font.replace(/\d+px/, options.fontSize + 'px');




            context.shadowColor = 'rgba(0,0,0,.2)';
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 3;
            context.shadowBlur = 5;


            var tagStyles;
            var btnPosition;
            var btnStyles;
            if (direction === 'left') {
                tagStyles = {
                    strokeStyle: colors[0],
                    fillStyle: colors[0]
                };
                btnPosition = {
                    x: options.x + 16,
                    y: options.y + options.height / 2
                };
                btnStyles = {
                    strokeStyle: colors[1],
                    fillStyle: colors[2],
                    lineWidth: 2
                }
            } else if (direction === 'right') {
                tagStyles = {
                    strokeStyle: colors[4],
                    fillStyle: colors[4]
                };
                btnPosition = {
                    x: options.x + options.width - 16,
                    y: options.y + options.height / 2
                };
                btnStyles = {
                    strokeStyle: colors[5],
                    fillStyle: colors[6],
                    lineWidth: 2
                };
            }

            this.group({
                x: options.x,
                y: options.y,
                width: options.width,
                height: options.height
            }, tagStyles);


            context.shadowColor = 'rgba(0,0,0,0)';

            this.button(btnPosition, btnStyles, isShow, data, btnClickCallback);

            if (typeof tagClickCallback === 'function') {
                this.eventList.push({
                    type: 'rect',
                    x: options.x,
                    y: options.y,
                    width: options.width,
                    height: options.height,
                    data: data,
                    callback: tagClickCallback
                })
            }


            context.textBaseline = 'middle';
            if (direction === 'left') {
                context.fillStyle = '#999';
                context.textAlign = 'end';
                context.fillText(
                    index,
                    options.x + 50,
                    options.y + options.height / 2
                );
                context.fillStyle = '#333';
                context.textAlign = 'start';
                textArr.forEach(function(text, index) {
                    context.fillText(
                        text,
                        options.x + 60,
                        options.y + options.verticalPadding / 2 + options.fontSize / 2 + index * options.lineHeight
                    );
                })
            } else if (direction === 'right') {
                context.fillStyle = '#999';
                context.textAlign = "end";
                context.fillText(
                    index,
                    options.x + 20,
                    options.y + options.height / 2
                );
                context.fillStyle = '#333';
                context.textAlign = 'start';
                textArr.forEach(function(text, index) {
                    context.fillText(
                        text,
                        options.x + 30,
                        options.y + options.verticalPadding / 2 + options.fontSize / 2 + index * options.lineHeight
                    );
                })
            }
            return {
                x: options.x,
                y: options.y,
                width: options.width,
                height: options.height + options.verticalPadding
            }
        },
        origin: function(opts) {
            var options = {
                x: 0,
                y: 0
            };
            extend(options, opts);
            var context = this.context;

            context.beginPath();
            context.fillStyle = colors[0];
            context.arc(options.x, options.y, 76, 0, Math.PI * 2, false);
            context.closePath();
            context.fill();

            context.beginPath();
            context.fillStyle = colors[3];
            context.arc(options.x, options.y, 68, 0, Math.PI * 2, false);
            context.closePath();
            context.fill();
        },
        line: function(opts, styles) {
            var options = {
                x: 0,
                y: 0,
                x1: 100,
                y1: 200,
                radius: 40
            };
            var style = {
                strokeStyle: '#ccc',
                lineWidth: 1
            };
            extend(options, opts);
            extend(style, styles);
            var context = this.context;
            extend(context, style);

            context.beginPath();
            context.moveTo(options.x, options.y);
            if (options.y === options.y1) {
                context.lineTo(options.x1, options.y1)
            } else {
                context.lineTo(
                    options.x + (options.x1 - options.x) / 2,
                    options.y
                );
                context.lineTo(
                    options.x + (options.x1 - options.x) / 2,
                    options.y1 < options.y ? options.y1 + options.radius : options.y1 - options.radius
                );
                context.arcTo(
                    options.x + (options.x1 - options.x) / 2,
                    options.y1,
                    options.x1,
                    options.y1,
                    options.radius
                );
                context.lineTo(options.x1, options.y1);
            }
            context.stroke();
        },
        clean: function() {
            this.eventList = [];
            this.context.clearRect(0, 0, this.width, this.height);
        }
    });

})(window);
