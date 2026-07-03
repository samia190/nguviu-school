var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "node_modules/react/cjs/react.development.js"(exports, module) {
    "use strict";
    (function() {
      function defineDeprecationWarning(methodName, info) {
        Object.defineProperty(Component.prototype, methodName, {
          get: function() {
            console.warn(
              "%s(...) is deprecated in plain JavaScript React classes. %s",
              info[0],
              info[1]
            );
          }
        });
      }
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable)
          return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      function warnNoop(publicInstance, callerName) {
        publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
        var warningKey = publicInstance + "." + callerName;
        didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
          "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
          callerName,
          publicInstance
        ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
      }
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function ComponentDummy() {
      }
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function noop() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        newKey = ReactElement(
          oldElement.type,
          newKey,
          oldElement.props,
          oldElement._owner,
          oldElement._debugStack,
          oldElement._debugTask
        );
        oldElement._store && (newKey._store.validated = oldElement._store.validated);
        return newKey;
      }
      function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback) {
          invokeCallback = children;
          callback = callback(invokeCallback);
          var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
          isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + childKey
          ), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
          return 1;
        }
        invokeCallback = 0;
        childKey = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), "function" === typeof i)
          for (i === children.entries && (didWarnAboutMaps || console.warn(
            "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
          ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var ioInfo = payload._ioInfo;
          null != ioInfo && (ioInfo.start = ioInfo.end = performance.now());
          ioInfo = payload._result;
          var thenable = ioInfo();
          thenable.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 1;
                payload._result = moduleObject;
                var _ioInfo = payload._ioInfo;
                null != _ioInfo && (_ioInfo.end = performance.now());
                void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
              }
            },
            function(error) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 2;
                payload._result = error;
                var _ioInfo2 = payload._ioInfo;
                null != _ioInfo2 && (_ioInfo2.end = performance.now());
                void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            }
          );
          ioInfo = payload._ioInfo;
          if (null != ioInfo) {
            ioInfo.value = thenable;
            var displayName = thenable.displayName;
            "string" === typeof displayName && (ioInfo.name = displayName);
          }
          -1 === payload._status && (payload._status = 0, payload._result = thenable);
        }
        if (1 === payload._status)
          return ioInfo = payload._result, void 0 === ioInfo && console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
            ioInfo
          ), "default" in ioInfo || console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
            ioInfo
          ), ioInfo.default;
        throw payload._result;
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      function releaseAsyncTransition() {
        ReactSharedInternals.asyncTransitions--;
      }
      function enqueueTask(task) {
        if (null === enqueueTaskImpl)
          try {
            var requireString = ("require" + Math.random()).slice(0, 7);
            enqueueTaskImpl = (module && module[requireString]).call(
              module,
              "timers"
            ).setImmediate;
          } catch (_err) {
            enqueueTaskImpl = function(callback) {
              false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
              ));
              var channel = new MessageChannel();
              channel.port1.onmessage = callback;
              channel.port2.postMessage(void 0);
            };
          }
        return enqueueTaskImpl(task);
      }
      function aggregateErrors(errors) {
        return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
      }
      function popActScope(prevActQueue, prevActScopeDepth) {
        prevActScopeDepth !== actScopeDepth - 1 && console.error(
          "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
        );
        actScopeDepth = prevActScopeDepth;
      }
      function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
        var queue = ReactSharedInternals.actQueue;
        if (null !== queue)
          if (0 !== queue.length)
            try {
              flushActQueue(queue);
              enqueueTask(function() {
                return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
              });
              return;
            } catch (error) {
              ReactSharedInternals.thrownErrors.push(error);
            }
          else ReactSharedInternals.actQueue = null;
        0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
      }
      function flushActQueue(queue) {
        if (!isFlushing) {
          isFlushing = true;
          var i = 0;
          try {
            for (; i < queue.length; i++) {
              var callback = queue[i];
              do {
                ReactSharedInternals.didUsePromise = false;
                var continuation = callback(false);
                if (null !== continuation) {
                  if (ReactSharedInternals.didUsePromise) {
                    queue[i] = callback;
                    queue.splice(0, i);
                    return;
                  }
                  callback = continuation;
                } else break;
              } while (1);
            }
            queue.length = 0;
          } catch (error) {
            queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
          } finally {
            isFlushing = false;
          }
        }
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function(publicInstance) {
          warnNoop(publicInstance, "forceUpdate");
        },
        enqueueReplaceState: function(publicInstance) {
          warnNoop(publicInstance, "replaceState");
        },
        enqueueSetState: function(publicInstance) {
          warnNoop(publicInstance, "setState");
        }
      }, assign = Object.assign, emptyObject = {};
      Object.freeze(emptyObject);
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      var deprecatedAPIs = {
        isMounted: [
          "isMounted",
          "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
        ],
        replaceState: [
          "replaceState",
          "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
        ]
      };
      for (fnName in deprecatedAPIs)
        deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
      ComponentDummy.prototype = Component.prototype;
      deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
      deprecatedAPIs.constructor = PureComponent;
      assign(deprecatedAPIs, Component.prototype);
      deprecatedAPIs.isPureReactComponent = true;
      var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = {
        H: null,
        A: null,
        T: null,
        S: null,
        actQueue: null,
        asyncTransitions: 0,
        isBatchingLegacy: false,
        didScheduleLegacyUpdate: false,
        didUsePromise: false,
        thrownErrors: [],
        getCurrentStack: null,
        recentlyCreatedOwnerStacks: 0
      }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      deprecatedAPIs = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
        deprecatedAPIs,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
        queueMicrotask(function() {
          return queueMicrotask(callback);
        });
      } : enqueueTask;
      deprecatedAPIs = Object.freeze({
        __proto__: null,
        c: function(size) {
          return resolveDispatcher().useMemoCache(size);
        }
      });
      var fnName = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = fnName;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = deprecatedAPIs;
      exports.act = function(callback) {
        var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
        actScopeDepth++;
        var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
        try {
          var result = callback();
        } catch (error) {
          ReactSharedInternals.thrownErrors.push(error);
        }
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        if (null !== result && "object" === typeof result && "function" === typeof result.then) {
          var thenable = result;
          queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
            ));
          });
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              thenable.then(
                function(returnValue) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  if (0 === prevActScopeDepth) {
                    try {
                      flushActQueue(queue), enqueueTask(function() {
                        return recursivelyFlushAsyncActWork(
                          returnValue,
                          resolve,
                          reject
                        );
                      });
                    } catch (error$0) {
                      ReactSharedInternals.thrownErrors.push(error$0);
                    }
                    if (0 < ReactSharedInternals.thrownErrors.length) {
                      var _thrownError = aggregateErrors(
                        ReactSharedInternals.thrownErrors
                      );
                      ReactSharedInternals.thrownErrors.length = 0;
                      reject(_thrownError);
                    }
                  } else resolve(returnValue);
                },
                function(error) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                    ReactSharedInternals.thrownErrors
                  ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                }
              );
            }
          };
        }
        var returnValue$jscomp$0 = result;
        popActScope(prevActQueue, prevActScopeDepth);
        0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
          didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
            "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
          ));
        }), ReactSharedInternals.actQueue = null);
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        return {
          then: function(resolve, reject) {
            didAwaitActCall = true;
            0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
              return recursivelyFlushAsyncActWork(
                returnValue$jscomp$0,
                resolve,
                reject
              );
            })) : resolve(returnValue$jscomp$0);
          }
        };
      };
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.captureOwnerStack = function() {
        var getCurrentStack = ReactSharedInternals.getCurrentStack;
        return null === getCurrentStack ? null : getCurrentStack();
      };
      exports.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key, owner = element._owner;
        if (null != config) {
          var JSCompiler_inline_result;
          a: {
            if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
              config,
              "ref"
            ).get) && JSCompiler_inline_result.isReactWarning) {
              JSCompiler_inline_result = false;
              break a;
            }
            JSCompiler_inline_result = void 0 !== config.ref;
          }
          JSCompiler_inline_result && (owner = getOwner());
          hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
          for (propName in config)
            !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        }
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          JSCompiler_inline_result = Array(propName);
          for (var i = 0; i < propName; i++)
            JSCompiler_inline_result[i] = arguments[i + 2];
          props.children = JSCompiler_inline_result;
        }
        props = ReactElement(
          element.type,
          key,
          props,
          owner,
          element._debugStack,
          element._debugTask
        );
        for (key = 2; key < arguments.length; key++)
          validateChildKeys(arguments[key]);
        return props;
      };
      exports.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        defaultValue._currentRenderer = null;
        defaultValue._currentRenderer2 = null;
        return defaultValue;
      };
      exports.createElement = function(type, config, children) {
        for (var i = 2; i < arguments.length; i++)
          validateChildKeys(arguments[i]);
        i = {};
        var key = null;
        if (null != config)
          for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
            "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
          )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
            hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) i.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
            childArray[_i] = arguments[_i + 2];
          Object.freeze && Object.freeze(childArray);
          i.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === i[propName] && (i[propName] = childrenLength[propName]);
        key && defineKeyPropWarningGetter(
          i,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        var propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return ReactElement(
          type,
          key,
          i,
          getOwner(),
          propName ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports.createRef = function() {
        var refObject = { current: null };
        Object.seal(refObject);
        return refObject;
      };
      exports.forwardRef = function(render) {
        null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
          "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
        ) : "function" !== typeof render ? console.error(
          "forwardRef requires a render function but was given %s.",
          null === render ? "null" : typeof render
        ) : 0 !== render.length && 2 !== render.length && console.error(
          "forwardRef render functions accept exactly two parameters: props and ref. %s",
          1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
        );
        null != render && null != render.defaultProps && console.error(
          "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
        );
        var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
        Object.defineProperty(elementType, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
          }
        });
        return elementType;
      };
      exports.isValidElement = isValidElement;
      exports.lazy = function(ctor) {
        ctor = { _status: -1, _result: ctor };
        var lazyType = {
          $$typeof: REACT_LAZY_TYPE,
          _payload: ctor,
          _init: lazyInitializer
        }, ioInfo = {
          name: "lazy",
          start: -1,
          end: -1,
          value: null,
          owner: null,
          debugStack: Error("react-stack-top-frame"),
          debugTask: console.createTask ? console.createTask("lazy()") : null
        };
        ctor._ioInfo = ioInfo;
        lazyType._debugInfo = [{ awaited: ioInfo }];
        return lazyType;
      };
      exports.memo = function(type, compare) {
        null == type && console.error(
          "memo: The first argument must be a component. Instead received: %s",
          null === type ? "null" : typeof type
        );
        compare = {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
        var ownName;
        Object.defineProperty(compare, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
          }
        });
        return compare;
      };
      exports.startTransition = function(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition._updatedFibers = /* @__PURE__ */ new Set();
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
            "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
          )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
            "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
          ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      };
      exports.unstable_useCacheRefresh = function() {
        return resolveDispatcher().useCacheRefresh();
      };
      exports.use = function(usable) {
        return resolveDispatcher().use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return resolveDispatcher().useActionState(
          action,
          initialState,
          permalink
        );
      };
      exports.useCallback = function(callback, deps) {
        return resolveDispatcher().useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        var dispatcher = resolveDispatcher();
        Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
          "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
        );
        return dispatcher.useContext(Context);
      };
      exports.useDebugValue = function(value, formatterFn) {
        return resolveDispatcher().useDebugValue(value, formatterFn);
      };
      exports.useDeferredValue = function(value, initialValue) {
        return resolveDispatcher().useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return resolveDispatcher().useEffectEvent(callback);
      };
      exports.useId = function() {
        return resolveDispatcher().useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return resolveDispatcher().useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return resolveDispatcher().useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return resolveDispatcher().useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init) {
        return resolveDispatcher().useReducer(reducer, initialArg, init);
      };
      exports.useRef = function(initialValue) {
        return resolveDispatcher().useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return resolveDispatcher().useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return resolveDispatcher().useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports.useTransition = function() {
        return resolveDispatcher().useTransition();
      };
      exports.version = "19.2.7";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/react/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_development();
    }
  }
});

// src/components/TeacherExamManagement.jsx
var import_react6 = __toESM(require_react(), 1);

// node_modules/lucide-react/dist/esm/createLucideIcon.js
var import_react2 = __toESM(require_react());

// node_modules/lucide-react/dist/esm/shared/src/utils.js
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && array.indexOf(className) === index;
}).join(" ");

// node_modules/lucide-react/dist/esm/Icon.js
var import_react = __toESM(require_react());

// node_modules/lucide-react/dist/esm/defaultAttributes.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// node_modules/lucide-react/dist/esm/Icon.js
var Icon = (0, import_react.forwardRef)(
  ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    className = "",
    children,
    iconNode,
    ...rest
  }, ref) => {
    return (0, import_react.createElement)(
      "svg",
      {
        ref,
        ...defaultAttributes,
        width: size,
        height: size,
        stroke: color,
        strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
        className: mergeClasses("lucide", className),
        ...rest
      },
      [
        ...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)),
        ...Array.isArray(children) ? children : [children]
      ]
    );
  }
);

// node_modules/lucide-react/dist/esm/createLucideIcon.js
var createLucideIcon = (iconName, iconNode) => {
  const Component = (0, import_react2.forwardRef)(
    ({ className, ...props }, ref) => (0, import_react2.createElement)(Icon, {
      ref,
      iconNode,
      className: mergeClasses(`lucide-${toKebabCase(iconName)}`, className),
      ...props
    })
  );
  Component.displayName = `${iconName}`;
  return Component;
};

// node_modules/lucide-react/dist/esm/icons/activity.js
var Activity = createLucideIcon("Activity", [
  [
    "path",
    {
      d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
      key: "169zse"
    }
  ]
]);

// node_modules/lucide-react/dist/esm/icons/camera-off.js
var CameraOff = createLucideIcon("CameraOff", [
  ["line", { x1: "2", x2: "22", y1: "2", y2: "22", key: "a6p6uj" }],
  ["path", { d: "M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16", key: "qmtpty" }],
  ["path", { d: "M9.5 4h5L17 7h3a2 2 0 0 1 2 2v7.5", key: "1ufyfc" }],
  ["path", { d: "M14.121 15.121A3 3 0 1 1 9.88 10.88", key: "11zox6" }]
]);

// node_modules/lucide-react/dist/esm/icons/camera.js
var Camera = createLucideIcon("Camera", [
  [
    "path",
    {
      d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
      key: "1tc9qg"
    }
  ],
  ["circle", { cx: "12", cy: "13", r: "3", key: "1vg3eu" }]
]);

// node_modules/lucide-react/dist/esm/icons/chart-column.js
var ChartColumn = createLucideIcon("ChartColumn", [
  ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16", key: "c24i48" }],
  ["path", { d: "M18 17V9", key: "2bz60n" }],
  ["path", { d: "M13 17V5", key: "1frdt8" }],
  ["path", { d: "M8 17v-3", key: "17ska0" }]
]);

// node_modules/lucide-react/dist/esm/icons/circle-alert.js
var CircleAlert = createLucideIcon("CircleAlert", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
  ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }]
]);

// node_modules/lucide-react/dist/esm/icons/circle-check-big.js
var CircleCheckBig = createLucideIcon("CircleCheckBig", [
  ["path", { d: "M21.801 10A10 10 0 1 1 17 3.335", key: "yps3ct" }],
  ["path", { d: "m9 11 3 3L22 4", key: "1pflzl" }]
]);

// node_modules/lucide-react/dist/esm/icons/circle-check.js
var CircleCheck = createLucideIcon("CircleCheck", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
]);

// node_modules/lucide-react/dist/esm/icons/circle-x.js
var CircleX = createLucideIcon("CircleX", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
  ["path", { d: "m9 9 6 6", key: "z0biqf" }]
]);

// node_modules/lucide-react/dist/esm/icons/clock-3.js
var Clock3 = createLucideIcon("Clock3", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["polyline", { points: "12 6 12 12 16.5 12", key: "1aq6pp" }]
]);

// node_modules/lucide-react/dist/esm/icons/clock.js
var Clock = createLucideIcon("Clock", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["polyline", { points: "12 6 12 12 16 14", key: "68esgv" }]
]);

// node_modules/lucide-react/dist/esm/icons/download.js
var Download = createLucideIcon("Download", [
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["polyline", { points: "7 10 12 15 17 10", key: "2ggqvy" }],
  ["line", { x1: "12", x2: "12", y1: "15", y2: "3", key: "1vk2je" }]
]);

// node_modules/lucide-react/dist/esm/icons/eye.js
var Eye = createLucideIcon("Eye", [
  [
    "path",
    {
      d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      key: "1nclc0"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);

// node_modules/lucide-react/dist/esm/icons/file-text.js
var FileText = createLucideIcon("FileText", [
  ["path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z", key: "1rqfz7" }],
  ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }]
]);

// node_modules/lucide-react/dist/esm/icons/pause.js
var Pause = createLucideIcon("Pause", [
  ["rect", { x: "14", y: "4", width: "4", height: "16", rx: "1", key: "zuxfzm" }],
  ["rect", { x: "6", y: "4", width: "4", height: "16", rx: "1", key: "1okwgv" }]
]);

// node_modules/lucide-react/dist/esm/icons/pencil.js
var Pencil = createLucideIcon("Pencil", [
  [
    "path",
    {
      d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",
      key: "1a8usu"
    }
  ],
  ["path", { d: "m15 5 4 4", key: "1mk7zo" }]
]);

// node_modules/lucide-react/dist/esm/icons/rotate-ccw.js
var RotateCcw = createLucideIcon("RotateCcw", [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }]
]);

// node_modules/lucide-react/dist/esm/icons/settings.js
var Settings = createLucideIcon("Settings", [
  [
    "path",
    {
      d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
      key: "1qme2f"
    }
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);

// node_modules/lucide-react/dist/esm/icons/trending-up.js
var TrendingUp = createLucideIcon("TrendingUp", [
  ["polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17", key: "126l90" }],
  ["polyline", { points: "16 7 22 7 22 13", key: "kwv8wd" }]
]);

// node_modules/lucide-react/dist/esm/icons/triangle-alert.js
var TriangleAlert = createLucideIcon("TriangleAlert", [
  [
    "path",
    {
      d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",
      key: "wmoenq"
    }
  ],
  ["path", { d: "M12 9v4", key: "juzpu7" }],
  ["path", { d: "M12 17h.01", key: "p32p05" }]
]);

// node_modules/lucide-react/dist/esm/icons/x.js
var X = createLucideIcon("X", [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
]);

// src/utils/api.js
var API_ORIGIN = (() => {
  try {
    if (typeof window !== "undefined" && window.__API_ORIGIN) return window.__API_ORIGIN;
  } catch {
  }
  try {
    if (typeof import.meta !== "undefined") {
      if (import.meta.env?.VITE_API_URL) {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (apiUrl && apiUrl.trim()) {
          return apiUrl;
        }
      }
      if (import.meta.env?.VITE_API_ORIGIN) return import.meta.env.VITE_API_ORIGIN;
    }
  } catch {
  }
  try {
    if (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
  } catch {
  }
  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.MODE === "production") {
      return "";
    }
  } catch {
  }
  return "";
})();
function getToken() {
  try {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
  } catch {
    return null;
  }
}
async function apiFetch(url, options = {}) {
  const headers = { ...options.headers || {} };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const isFormData = options.body instanceof FormData;
  const resolvedUrl = url.startsWith("http") ? url : `${API_ORIGIN.replace(/\/+$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
  const res = await fetch(resolvedUrl, {
    method: options.method || "GET",
    headers: isFormData ? headers : { "Content-Type": "application/json", ...headers },
    body: isFormData ? options.body : options.body ? JSON.stringify(options.body) : void 0
  });
  const text = await res.text();
  let data;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html") || text && text.trim().startsWith("<")) {
    const err = new Error(`Expected JSON but received HTML response from ${resolvedUrl}`);
    err.status = res.status;
    err.body = text;
    err.url = resolvedUrl;
    throw err;
  }
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || "Request failed");
    err.status = res.status;
    err.body = data;
    err.url = resolvedUrl;
    throw err;
  }
  return data;
}
async function get(path) {
  return apiFetch(path, { method: "GET" });
}
async function post(path, body) {
  return apiFetch(path, { method: "POST", body });
}
async function put(path, body) {
  return apiFetch(path, { method: "PUT", body });
}
function upload(url, formData, extraHeaders = {}, options = {}) {
  const fullUrl = url.startsWith("http") ? url : `${API_ORIGIN.replace(/\/+$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
  const token = getToken();
  const headers = { ...extraHeaders };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const method = options.method || "POST";
  if (options.setLoading) options.setLoading(true);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, fullUrl, true);
    Object.entries(headers).forEach(([k, v]) => {
      try {
        xhr.setRequestHeader(k, v);
      } catch (e) {
      }
    });
    xhr.onload = () => {
      if (options.setLoading) options.setLoading(false);
      const text = xhr.responseText;
      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
      const err = new Error(data?.error || xhr.statusText || "Upload failed");
      err.status = xhr.status;
      err.body = data;
      return reject(err);
    };
    xhr.onerror = () => {
      if (options.setLoading) options.setLoading(false);
      const err = new Error("Network error during upload");
      return reject(err);
    };
    if (options.onProgress && xhr.upload) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round(evt.loaded / evt.total * 100);
          try {
            options.onProgress(pct);
          } catch (e) {
          }
        }
      };
    }
    xhr.send(formData);
  });
}
async function del(url) {
  const fullUrl = url.startsWith("http") ? url : `${API_ORIGIN.replace(/\/+$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
  const token = getToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(fullUrl, {
    method: "DELETE",
    headers
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(`${data?.error || res.statusText || "Delete failed"} (url: ${fullUrl})`);
    err.status = res.status;
    err.body = data;
    err.url = fullUrl;
    throw err;
  }
  return data;
}

// src/components/Loader.jsx
var import_react3 = __toESM(require_react(), 1);

// src/utils/paths.js
function safePath(p) {
  if (!p) return p;
  try {
    const normalized = String(p).replace(/\\/g, "/");
    return encodeURI(normalized);
  } catch (e) {
    return p;
  }
}

// src/components/Loader.jsx
function Loader({ size = 140 }) {
  const px = typeof size === "number" ? `${size}px` : size;
  return /* @__PURE__ */ import_react3.default.createElement("div", { className: "site-loader", style: { ["--loader-size"]: px } }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "loader-ring" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "loader-inner" }, /* @__PURE__ */ import_react3.default.createElement("img", { src: safePath("/header/logo new.PNG"), alt: "kangaru girls logo", className: "loader-logo" })));
}

// src/components/TeacherExamReview.jsx
var import_react4 = __toESM(require_react(), 1);
var STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" }
];
function TeacherExamReview({ exam, onClose }) {
  const [files, setFiles] = (0, import_react4.useState)([]);
  const [loading, setLoading] = (0, import_react4.useState)(true);
  const [error, setError] = (0, import_react4.useState)(null);
  const [editingFileId, setEditingFileId] = (0, import_react4.useState)(null);
  const [editState, setEditState] = (0, import_react4.useState)({ originalName: "", reviewerNotes: "", status: "pending", notes: "" });
  const loadFiles = async () => {
    if (!exam?._id) return;
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`/api/exams/${exam._id}/working-files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load student work");
      const data = await res.json();
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (err) {
      console.error("Error loading working files:", err);
      setError(err.message || "Unable to load student work");
    } finally {
      setLoading(false);
    }
  };
  (0, import_react4.useEffect)(() => {
    loadFiles();
  }, [exam]);
  const groupedByStudent = files.reduce((acc, file) => {
    const studentKey = file.sessionId || file.studentEmail || file.studentName || "unknown";
    const studentName = file.studentName || file.studentEmail || "Unknown student";
    const studentEmail = file.studentEmail || "";
    const questionText = file.questionText || "General attachment";
    if (!acc[studentKey]) {
      acc[studentKey] = { studentName, studentEmail, items: [] };
    }
    acc[studentKey].items.push({ ...file, questionText });
    return acc;
  }, {});
  const startEdit = (file) => {
    setEditingFileId(file._id);
    setEditState({
      originalName: file.originalName || file.filename || "",
      reviewerNotes: file.reviewerNotes || "",
      status: file.status || "pending",
      notes: file.notes || ""
    });
  };
  const cancelEdit = () => {
    setEditingFileId(null);
    setEditState({ originalName: "", reviewerNotes: "", status: "pending", notes: "" });
  };
  const saveFileReview = async (fileId) => {
    try {
      await put(`/api/submissions/${fileId}`, {
        status: editState.status,
        reviewerNotes: editState.reviewerNotes,
        originalName: editState.originalName,
        notes: editState.notes
      });
      cancelEdit();
      const refreshed = await fetch(`/api/exams/${exam._id}/working-files`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` }
      });
      const data = await refreshed.json();
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (err) {
      console.error("Failed to save review changes:", err);
      setError(err.message || "Could not save review changes");
    }
  };
  const updateFileStatus = async (fileId, status) => {
    try {
      await put(`/api/submissions/${fileId}`, { status });
      const refreshed = await fetch(`/api/exams/${exam._id}/working-files`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` }
      });
      const data = await refreshed.json();
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(err.message || "Could not update status");
    }
  };
  return /* @__PURE__ */ import_react4.default.createElement("div", { style: { marginTop: 36, padding: 24, border: "1px solid #d1d5db", borderRadius: 14, background: "#fff" } }, /* @__PURE__ */ import_react4.default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 } }, /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("h2", { style: { margin: 0, fontSize: 22 } }, "Review Student Working for \u201C", exam.title, "\u201D"), /* @__PURE__ */ import_react4.default.createElement("p", { style: { margin: "8px 0 0", color: "#4b5563" } }, "Review uploaded working files grouped by student and question.")), /* @__PURE__ */ import_react4.default.createElement("button", { onClick: onClose, style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#ef4444", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, /* @__PURE__ */ import_react4.default.createElement(X, { size: 16 }), " Close")), loading && /* @__PURE__ */ import_react4.default.createElement("p", null, "Loading student work..."), error && /* @__PURE__ */ import_react4.default.createElement("p", { style: { color: "#b91c1c" } }, error), !loading && !error && files.length === 0 && /* @__PURE__ */ import_react4.default.createElement("p", { style: { color: "#475569" } }, "No student working files have been uploaded for this exam yet."), !loading && files.length > 0 && /* @__PURE__ */ import_react4.default.createElement("div", { style: { display: "grid", gap: 20 } }, Object.entries(groupedByStudent).map(([studentKey, studentGroup]) => /* @__PURE__ */ import_react4.default.createElement("div", { key: studentKey, style: { border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, background: "#f8fafc" } }, /* @__PURE__ */ import_react4.default.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", marginBottom: 18 } }, /* @__PURE__ */ import_react4.default.createElement("div", null, /* @__PURE__ */ import_react4.default.createElement("h3", { style: { margin: 0, fontSize: 20 } }, studentGroup.studentName), studentGroup.studentEmail && /* @__PURE__ */ import_react4.default.createElement("p", { style: { margin: "6px 0 0", color: "#475569" } }, studentGroup.studentEmail)), /* @__PURE__ */ import_react4.default.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", onClick: loadFiles, style: { padding: "10px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, "Refresh"))), /* @__PURE__ */ import_react4.default.createElement("div", { style: { display: "grid", gap: 16 } }, studentGroup.items.map((file) => {
    const isEditing = editingFileId === file._id;
    return /* @__PURE__ */ import_react4.default.createElement("div", { key: file._id, style: { padding: 18, border: "1px solid #cbd5e1", borderRadius: 12, background: "white" } }, /* @__PURE__ */ import_react4.default.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" } }, /* @__PURE__ */ import_react4.default.createElement("div", { style: { minWidth: 0, flex: 1 } }, /* @__PURE__ */ import_react4.default.createElement("p", { style: { margin: 0, color: "#6b7280", fontSize: 14 } }, /* @__PURE__ */ import_react4.default.createElement("strong", null, "Question:"), " ", file.questionText), /* @__PURE__ */ import_react4.default.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 8 } }, /* @__PURE__ */ import_react4.default.createElement("div", { style: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "#111" } }, /* @__PURE__ */ import_react4.default.createElement(FileText, { size: 16 }), /* @__PURE__ */ import_react4.default.createElement("strong", null, file.originalName || file.filename)), /* @__PURE__ */ import_react4.default.createElement("span", { style: { padding: "4px 10px", borderRadius: 999, background: file.status === "approved" ? "#dcfce7" : file.status === "rejected" ? "#fee2e2" : "#e2e8f0", color: file.status === "approved" ? "#166534" : file.status === "rejected" ? "#991b1b" : "#475569", fontSize: 12, fontWeight: 600 } }, file.status || "pending")), /* @__PURE__ */ import_react4.default.createElement("p", { style: { margin: "10px 0 0", color: "#475569" } }, /* @__PURE__ */ import_react4.default.createElement("strong", null, "Uploaded:"), " ", new Date(file.uploadedAt || Date.now()).toLocaleString())), /* @__PURE__ */ import_react4.default.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ import_react4.default.createElement("a", { href: file.downloadUrl || file.url, target: "_blank", rel: "noreferrer", style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#2563eb", color: "white", borderRadius: 8, textDecoration: "none" } }, /* @__PURE__ */ import_react4.default.createElement(Download, { size: 16 }), " Download"), /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", onClick: () => startEdit(file), style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#f59e0b", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, /* @__PURE__ */ import_react4.default.createElement(Pencil, { size: 16 }), " Edit"), /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", onClick: () => updateFileStatus(file._id, "approved"), style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, /* @__PURE__ */ import_react4.default.createElement(CircleCheck, { size: 16 }), " Approve"), /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", onClick: () => updateFileStatus(file._id, "rejected"), style: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 14px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, /* @__PURE__ */ import_react4.default.createElement(CircleX, { size: 16 }), " Reject"))), isEditing && /* @__PURE__ */ import_react4.default.createElement("div", { style: { marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12, background: "#f8fafc" } }, /* @__PURE__ */ import_react4.default.createElement("div", { style: { display: "grid", gap: 12 } }, /* @__PURE__ */ import_react4.default.createElement("label", { style: { display: "grid", gap: 6 } }, "File label", /* @__PURE__ */ import_react4.default.createElement(
      "input",
      {
        type: "text",
        value: editState.originalName,
        onChange: (e) => setEditState({ ...editState, originalName: e.target.value }),
        style: { width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }
      }
    )), /* @__PURE__ */ import_react4.default.createElement("label", { style: { display: "grid", gap: 6 } }, "Reviewer notes", /* @__PURE__ */ import_react4.default.createElement(
      "textarea",
      {
        value: editState.reviewerNotes,
        onChange: (e) => setEditState({ ...editState, reviewerNotes: e.target.value }),
        rows: 4,
        style: { width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }
      }
    )), /* @__PURE__ */ import_react4.default.createElement("label", { style: { display: "grid", gap: 6 } }, "Public notes", /* @__PURE__ */ import_react4.default.createElement(
      "textarea",
      {
        value: editState.notes,
        onChange: (e) => setEditState({ ...editState, notes: e.target.value }),
        rows: 2,
        style: { width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }
      }
    )), /* @__PURE__ */ import_react4.default.createElement("label", { style: { display: "grid", gap: 6 } }, "Review status", /* @__PURE__ */ import_react4.default.createElement(
      "select",
      {
        value: editState.status,
        onChange: (e) => setEditState({ ...editState, status: e.target.value }),
        style: { width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }
      },
      STATUS_OPTIONS.map((option) => /* @__PURE__ */ import_react4.default.createElement("option", { key: option.value, value: option.value }, option.label))
    ))), /* @__PURE__ */ import_react4.default.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 } }, /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", onClick: () => saveFileReview(file._id), style: { padding: "10px 18px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, "Save Review"), /* @__PURE__ */ import_react4.default.createElement("button", { type: "button", onClick: cancelEdit, style: { padding: "10px 18px", background: "#6b7280", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, "Cancel"))));
  }))))));
}

// src/components/LiveInvigilation.jsx
var import_react5 = __toESM(require_react(), 1);
var LiveInvigilation = ({ examId, sessionId }) => {
  const [monitoringSessions, setMonitoringSessions] = (0, import_react5.useState)([]);
  const [selectedStudent, setSelectedStudent] = (0, import_react5.useState)(null);
  const [alerts, setAlerts] = (0, import_react5.useState)([]);
  const [stats, setStats] = (0, import_react5.useState)({
    total: 0,
    active: 0,
    idle: 0,
    critical: 0,
    warnings: 0
  });
  const [view, setView] = (0, import_react5.useState)("grid");
  const [refreshInterval, setRefreshInterval] = (0, import_react5.useState)(3e3);
  const [isAutoRefresh, setIsAutoRefresh] = (0, import_react5.useState)(true);
  const [searchTerm, setSearchTerm] = (0, import_react5.useState)("");
  const [filterBySeverity, setFilterBySeverity] = (0, import_react5.useState)("all");
  const fetchMonitoringSessions = (0, import_react5.useCallback)(async () => {
    try {
      const response = await fetch(`/api/exams/sessions/monitoring?examId=${examId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      if (data.ok) {
        setMonitoringSessions(data.sessions || []);
        updateStats(data.sessions || []);
      }
    } catch (error) {
      console.error("Error fetching monitoring sessions:", error);
    }
  }, [examId]);
  const fetchAlerts = (0, import_react5.useCallback)(async () => {
    try {
      const response = await fetch(`/api/exams/${examId}/alerts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await response.json();
      if (data.ok) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  }, [examId]);
  const updateStats = (sessions) => {
    const active = sessions.filter((s) => s.monitoringStatus === "active").length;
    const idle = sessions.filter((s) => s.monitoringStatus === "idle").length;
    const critical = sessions.filter(
      (s) => s.recentEvents?.some((e) => e.severity === "critical")
    ).length;
    const warnings = sessions.filter(
      (s) => s.recentEvents?.some((e) => e.severity === "warning")
    ).length;
    setStats({
      total: sessions.length,
      active,
      idle,
      critical,
      warnings
    });
  };
  (0, import_react5.useEffect)(() => {
    if (!isAutoRefresh) return;
    fetchMonitoringSessions();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchMonitoringSessions();
      fetchAlerts();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval, fetchMonitoringSessions, fetchAlerts]);
  const acknowledgeAlert = async (alertId) => {
    try {
      await fetch(`/api/exams/alerts/${alertId}/acknowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      fetchAlerts();
    } catch (error) {
      console.error("Error acknowledging alert:", error);
    }
  };
  const filteredSessions = monitoringSessions.filter((session) => {
    const matchesSearch = session.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || session.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterBySeverity === "critical") {
      return matchesSearch && session.recentEvents?.some((e) => e.severity === "critical");
    } else if (filterBySeverity === "warning") {
      return matchesSearch && session.recentEvents?.some((e) => e.severity === "warning");
    }
    return matchesSearch;
  });
  const getStatusColor = (status) => {
    if (status === "submitted") return "#10b981";
    if (status === "active") return "#3b82f6";
    if (status === "idle") return "#f59e0b";
    return "#6b7280";
  };
  const getSeverityColor = (severity) => {
    if (severity === "critical") return "#dc2626";
    if (severity === "warning") return "#f59e0b";
    return "#10b981";
  };
  return /* @__PURE__ */ import_react5.default.createElement("div", { className: "live-invigilation-container" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "invigilation-header" }, /* @__PURE__ */ import_react5.default.createElement("div", null, /* @__PURE__ */ import_react5.default.createElement("h1", null, "Live Invigilation Dashboard"), /* @__PURE__ */ import_react5.default.createElement("p", null, "Real-time exam monitoring and proctoring")), /* @__PURE__ */ import_react5.default.createElement("div", { className: "header-controls" }, /* @__PURE__ */ import_react5.default.createElement(
    "button",
    {
      className: `control-btn ${isAutoRefresh ? "active" : ""}`,
      onClick: () => setIsAutoRefresh(!isAutoRefresh),
      title: "Toggle auto-refresh"
    },
    /* @__PURE__ */ import_react5.default.createElement(RotateCcw, { size: 18 }),
    isAutoRefresh ? "Auto" : "Manual"
  ), /* @__PURE__ */ import_react5.default.createElement(
    "select",
    {
      value: refreshInterval,
      onChange: (e) => setRefreshInterval(parseInt(e.target.value)),
      className: "control-select"
    },
    /* @__PURE__ */ import_react5.default.createElement("option", { value: 2e3 }, "2s refresh"),
    /* @__PURE__ */ import_react5.default.createElement("option", { value: 3e3 }, "3s refresh"),
    /* @__PURE__ */ import_react5.default.createElement("option", { value: 5e3 }, "5s refresh"),
    /* @__PURE__ */ import_react5.default.createElement("option", { value: 1e4 }, "10s refresh")
  ), /* @__PURE__ */ import_react5.default.createElement(
    "button",
    {
      className: "control-btn",
      onClick: () => setView(view === "grid" ? "detail" : "grid"),
      title: "Toggle view"
    },
    /* @__PURE__ */ import_react5.default.createElement(Eye, { size: 18 })
  ))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stats-grid" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-card" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-icon", style: { backgroundColor: "#3b82f6" } }, /* @__PURE__ */ import_react5.default.createElement(TrendingUp, { size: 24 })), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-content" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-value" }, stats.total), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-label" }, "Total Students"))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-card" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-icon", style: { backgroundColor: "#10b981" } }, /* @__PURE__ */ import_react5.default.createElement(CircleCheckBig, { size: 24 })), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-content" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-value" }, stats.active), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-label" }, "Active Now"))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-card" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-icon", style: { backgroundColor: "#f59e0b" } }, /* @__PURE__ */ import_react5.default.createElement(Pause, { size: 24 })), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-content" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-value" }, stats.idle), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-label" }, "Idle"))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-card" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-icon", style: { backgroundColor: "#ef4444" } }, /* @__PURE__ */ import_react5.default.createElement(TriangleAlert, { size: 24 })), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-content" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-value" }, stats.critical), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-label" }, "Critical Alerts"))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-card" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-icon", style: { backgroundColor: "#f59e0b" } }, /* @__PURE__ */ import_react5.default.createElement(CircleAlert, { size: 24 })), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-content" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-value" }, stats.warnings), /* @__PURE__ */ import_react5.default.createElement("div", { className: "stat-label" }, "Warnings")))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "invigilation-controls" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "search-box" }, /* @__PURE__ */ import_react5.default.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search students by name or email...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "search-input"
    }
  )), /* @__PURE__ */ import_react5.default.createElement("div", { className: "filter-group" }, /* @__PURE__ */ import_react5.default.createElement(
    "select",
    {
      value: filterBySeverity,
      onChange: (e) => setFilterBySeverity(e.target.value),
      className: "filter-select"
    },
    /* @__PURE__ */ import_react5.default.createElement("option", { value: "all" }, "All Students"),
    /* @__PURE__ */ import_react5.default.createElement("option", { value: "critical" }, "Critical Only"),
    /* @__PURE__ */ import_react5.default.createElement("option", { value: "warning" }, "Warnings Only")
  ))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "invigilation-content" }, view === "grid" ? (
    // Grid View
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "students-grid" }, filteredSessions.map((session) => /* @__PURE__ */ import_react5.default.createElement(
      StudentCard,
      {
        key: session._id,
        session,
        onSelect: () => {
          setSelectedStudent(session);
          setView("detail");
        }
      }
    )))
  ) : selectedStudent ? (
    // Detail View
    /* @__PURE__ */ import_react5.default.createElement(
      StudentDetailPanel,
      {
        session: selectedStudent,
        onClose: () => {
          setSelectedStudent(null);
          setView("grid");
        }
      }
    )
  ) : null), /* @__PURE__ */ import_react5.default.createElement("div", { className: "alert-inbox-section" }, /* @__PURE__ */ import_react5.default.createElement("h3", null, "Alert Inbox (", alerts.filter((a) => !a.acknowledged).length, ")"), /* @__PURE__ */ import_react5.default.createElement("div", { className: "alert-list" }, alerts.slice(0, 8).map((alert) => /* @__PURE__ */ import_react5.default.createElement(
    "div",
    {
      key: alert._id,
      className: "alert-item",
      style: {
        borderLeftColor: getSeverityColor(alert.severity),
        opacity: alert.acknowledged ? 0.6 : 1
      }
    },
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "alert-header" }, /* @__PURE__ */ import_react5.default.createElement("span", { className: "alert-severity", style: { color: getSeverityColor(alert.severity) } }, alert.severity.toUpperCase()), /* @__PURE__ */ import_react5.default.createElement("span", { className: "alert-time" }, new Date(alert.timestamp).toLocaleTimeString())),
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "alert-body" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "alert-student" }, alert.studentId?.name || "Student"), /* @__PURE__ */ import_react5.default.createElement("div", { className: "alert-event" }, alert.eventType || alert.description)),
    !alert.acknowledged && /* @__PURE__ */ import_react5.default.createElement(
      "button",
      {
        className: "alert-action",
        onClick: () => acknowledgeAlert(alert._id)
      },
      "Mark Acknowledged"
    )
  )))));
};
var StudentCard = ({ session, onSelect }) => {
  const hasCritical = session.recentEvents?.some((e) => e.severity === "critical");
  const hasWarning = session.recentEvents?.some((e) => e.severity === "warning");
  const alertCount = session.recentEvents?.length || 0;
  return /* @__PURE__ */ import_react5.default.createElement(
    "div",
    {
      className: `student-card ${hasCritical ? "critical" : ""} ${hasWarning ? "warning" : ""}`,
      onClick: onSelect
    },
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "student-avatar" }, session.studentId?.name?.charAt(0).toUpperCase()),
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "student-info" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "student-name" }, session.studentId?.name || "Student"), /* @__PURE__ */ import_react5.default.createElement("div", { className: "student-status" }, /* @__PURE__ */ import_react5.default.createElement(
      "span",
      {
        className: "status-badge",
        style: {
          backgroundColor: session.monitoringStatus === "active" ? "#10b981" : session.monitoringStatus === "idle" ? "#f59e0b" : "#6b7280"
        }
      },
      session.monitoringStatus || "unknown"
    ))),
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "student-indicators" }, session.cameraEnabled ? /* @__PURE__ */ import_react5.default.createElement(Camera, { size: 18, style: { color: "#10b981" } }) : /* @__PURE__ */ import_react5.default.createElement(CameraOff, { size: 18, style: { color: "#ef4444" } })),
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "student-alerts" }, hasCritical && /* @__PURE__ */ import_react5.default.createElement(TriangleAlert, { size: 16, style: { color: "#ef4444" } }), hasWarning && /* @__PURE__ */ import_react5.default.createElement(CircleAlert, { size: 16, style: { color: "#f59e0b" } }), alertCount > 0 && /* @__PURE__ */ import_react5.default.createElement("span", { className: "alert-count" }, alertCount)),
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "student-timer" }, session.remainingSeconds && /* @__PURE__ */ import_react5.default.createElement(import_react5.default.Fragment, null, /* @__PURE__ */ import_react5.default.createElement(Clock, { size: 14 }), /* @__PURE__ */ import_react5.default.createElement("span", null, Math.floor(session.remainingSeconds / 60), "m")))
  );
};
var StudentDetailPanel = ({ session, onClose }) => {
  return /* @__PURE__ */ import_react5.default.createElement("div", { className: "student-detail-panel" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "detail-header" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "detail-avatar" }, session.studentId?.name?.charAt(0).toUpperCase()), /* @__PURE__ */ import_react5.default.createElement("div", { className: "detail-title" }, /* @__PURE__ */ import_react5.default.createElement("h2", null, session.studentId?.name), /* @__PURE__ */ import_react5.default.createElement("p", null, session.studentId?.email)), /* @__PURE__ */ import_react5.default.createElement("button", { className: "close-btn", onClick: onClose }, "\u2715")), /* @__PURE__ */ import_react5.default.createElement("div", { className: "detail-content" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "detail-section" }, /* @__PURE__ */ import_react5.default.createElement("h3", null, "Current Status"), /* @__PURE__ */ import_react5.default.createElement("div", { className: "status-grid" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "status-item" }, /* @__PURE__ */ import_react5.default.createElement("span", { className: "label" }, "Monitoring Status"), /* @__PURE__ */ import_react5.default.createElement(
    "span",
    {
      className: "value",
      style: {
        color: session.monitoringStatus === "active" ? "#10b981" : session.monitoringStatus === "idle" ? "#f59e0b" : "#6b7280"
      }
    },
    session.monitoringStatus
  )), /* @__PURE__ */ import_react5.default.createElement("div", { className: "status-item" }, /* @__PURE__ */ import_react5.default.createElement("span", { className: "label" }, "Connection"), /* @__PURE__ */ import_react5.default.createElement(
    "span",
    {
      className: "value",
      style: {
        color: session.connectionStatus === "connected" ? "#10b981" : "#ef4444"
      }
    },
    session.connectionStatus
  )), /* @__PURE__ */ import_react5.default.createElement("div", { className: "status-item" }, /* @__PURE__ */ import_react5.default.createElement("span", { className: "label" }, "Camera"), /* @__PURE__ */ import_react5.default.createElement(
    "span",
    {
      className: "value",
      style: {
        color: session.cameraEnabled ? "#10b981" : "#ef4444"
      }
    },
    session.cameraEnabled ? "Enabled" : "Disabled"
  )), /* @__PURE__ */ import_react5.default.createElement("div", { className: "status-item" }, /* @__PURE__ */ import_react5.default.createElement("span", { className: "label" }, "Time Remaining"), /* @__PURE__ */ import_react5.default.createElement("span", { className: "value" }, session.remainingSeconds ? `${Math.floor(session.remainingSeconds / 60)}m ${session.remainingSeconds % 60}s` : "N/A")))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "detail-section" }, /* @__PURE__ */ import_react5.default.createElement("h3", null, "Exam Progress"), /* @__PURE__ */ import_react5.default.createElement("div", { className: "progress-info" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "progress-bar" }, /* @__PURE__ */ import_react5.default.createElement(
    "div",
    {
      className: "progress-fill",
      style: {
        width: `${(session.currentQuestionIndex || 0) / (session.examId?.totalQuestions || 1) * 100}%`
      }
    }
  )), /* @__PURE__ */ import_react5.default.createElement("div", { className: "progress-text" }, "Question ", (session.currentQuestionIndex || 0) + 1, " of ", session.examId?.totalQuestions || "?"))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "detail-section" }, /* @__PURE__ */ import_react5.default.createElement("h3", null, "Recent Events (", session.recentEvents?.length || 0, ")"), /* @__PURE__ */ import_react5.default.createElement("div", { className: "events-list" }, session.recentEvents?.slice(0, 5).map((event, idx) => /* @__PURE__ */ import_react5.default.createElement("div", { key: idx, className: "event-item" }, /* @__PURE__ */ import_react5.default.createElement(
    "span",
    {
      className: "event-severity",
      style: {
        backgroundColor: event.severity === "critical" ? "#ef4444" : event.severity === "warning" ? "#f59e0b" : "#10b981"
      }
    },
    event.severity.charAt(0).toUpperCase()
  ), /* @__PURE__ */ import_react5.default.createElement("span", { className: "event-type" }, event.eventType), /* @__PURE__ */ import_react5.default.createElement("span", { className: "event-time" }, new Date(event.timestamp).toLocaleTimeString())))))));
};
var LiveInvigilation_default = LiveInvigilation;

// src/components/TeacherExamManagement.jsx
var initialExamForm = {
  title: "",
  subject: "",
  description: "",
  duration: 60,
  totalMarks: 100,
  passThreshold: 50,
  proctoringLevel: "moderate",
  trustScoreThreshold: 50,
  allowedMaterials: "",
  scheduledStart: "",
  scheduledEnd: "",
  instructions: "",
  pdfUrl: ""
};
function TeacherExamManagement({ user }) {
  const [exams, setExams] = (0, import_react6.useState)([]);
  const [loading, setLoading] = (0, import_react6.useState)(true);
  const [form, setForm] = (0, import_react6.useState)(initialExamForm);
  const [editingId, setEditingId] = (0, import_react6.useState)(null);
  const [status, setStatus] = (0, import_react6.useState)({ message: "", error: false });
  const [reviewExam, setReviewExam] = (0, import_react6.useState)(null);
  const [monitoringSessions, setMonitoringSessions] = (0, import_react6.useState)([]);
  const [monitoringLoading, setMonitoringLoading] = (0, import_react6.useState)(false);
  const [selectedSessionId, setSelectedSessionId] = (0, import_react6.useState)(null);
  const [searchTerm, setSearchTerm] = (0, import_react6.useState)("");
  const [activeTab, setActiveTab] = (0, import_react6.useState)("exams");
  const fetchMyExams = (0, import_react6.useCallback)(async () => {
    setLoading(true);
    try {
      const data = await get("/api/exams/mine");
      setExams(Array.isArray(data.exams) ? data.exams : []);
      setStatus({ message: "", error: false });
    } catch (err) {
      console.error(err);
      setStatus({ message: "Failed to load exams.", error: true });
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchMonitoringSessions = (0, import_react6.useCallback)(async () => {
    try {
      setMonitoringLoading(true);
      const data = await get("/api/exams/sessions/monitoring");
      setMonitoringSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err) {
      console.error(err);
    } finally {
      setMonitoringLoading(false);
    }
  }, []);
  (0, import_react6.useEffect)(() => {
    if (user && (user._id || user.id) && getToken()) {
      fetchMyExams();
      fetchMonitoringSessions();
    }
  }, [user, fetchMyExams, fetchMonitoringSessions]);
  (0, import_react6.useEffect)(() => {
    if (!user || !(user._id || user.id) || !getToken()) return;
    fetchMonitoringSessions();
    const interval = setInterval(() => {
      fetchMonitoringSessions();
    }, 15e3);
    return () => clearInterval(interval);
  }, [user, fetchMonitoringSessions]);
  (0, import_react6.useEffect)(() => {
    if (monitoringSessions.length > 0 && (!selectedSessionId || !monitoringSessions.some((session) => session._id === selectedSessionId))) {
      setSelectedSessionId(monitoringSessions[0]._id);
    }
  }, [monitoringSessions]);
  const selectedSession = monitoringSessions.find((session) => session._id === selectedSessionId) || null;
  const suspiciousSummary = monitoringSessions.reduce(
    (acc, session) => {
      const events = session.recentEvents || [];
      acc.warning += events.filter((event) => event.severity === "warning").length;
      acc.critical += events.filter((event) => event.severity === "critical").length;
      return acc;
    },
    { warning: 0, critical: 0 }
  );
  const filteredSessions = monitoringSessions.filter((session) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    const haystack = [
      session.studentId?.name || "",
      session.studentId?.admissionNumber || "",
      session.examId?.title || ""
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
  const summaryCounts = monitoringSessions.reduce(
    (acc, session) => {
      acc.total += 1;
      if (session.monitoringStatus === "Submitted") acc.submitted += 1;
      else if (session.monitoringStatus === "Disconnected") acc.disconnected += 1;
      else acc.active += 1;
      if (session.cameraEnabled) acc.cameraReady += 1;
      return acc;
    },
    { total: 0, active: 0, submitted: 0, disconnected: 0, cameraReady: 0 }
  );
  const alertInbox = monitoringSessions.flatMap(
    (session) => (session.recentEvents || []).map((event) => ({
      ...event,
      studentName: session.studentId?.name || "Student",
      examTitle: session.examId?.title || "Exam",
      sessionId: session._id
    }))
  ).sort((left, right) => new Date(right.timestamp || right.createdAt || 0) - new Date(left.timestamp || left.createdAt || 0));
  const formatRemainingTime = (seconds) => {
    const safeSeconds = Number(seconds) || 0;
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ message: "", error: false });
    try {
      const payload = {
        ...form,
        allowedMaterials: form.allowedMaterials.split(",").map((item) => item.trim()).filter(Boolean)
      };
      if (editingId) {
        await put(`/api/exams/${editingId}`, payload);
        setStatus({ message: "Exam updated successfully.", error: false });
      } else {
        await post("/api/exams", payload);
        setStatus({ message: "Exam created successfully.", error: false });
      }
      setForm(initialExamForm);
      setEditingId(null);
      fetchMyExams();
    } catch (err) {
      console.error(err);
      setStatus({ message: err.message || "Failed to save exam.", error: true });
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (exam) => {
    setEditingId(exam._id);
    setForm({
      title: exam.title || "",
      subject: exam.subject || "",
      description: exam.description || "",
      duration: exam.duration || 60,
      totalMarks: exam.totalMarks || 100,
      passThreshold: exam.passThreshold || 50,
      proctoringLevel: exam.proctoringLevel || "moderate",
      trustScoreThreshold: exam.trustScoreThreshold || 50,
      allowedMaterials: (exam.allowedMaterials || []).join(", "),
      scheduledStart: exam.scheduledStart ? exam.scheduledStart.slice(0, 16) : "",
      scheduledEnd: exam.scheduledEnd ? exam.scheduledEnd.slice(0, 16) : "",
      instructions: exam.instructions || "",
      pdfUrl: exam.pdfUrl || ""
    });
  };
  const handleDelete = async (examId) => {
    if (!confirm("Delete this exam permanently?")) return;
    setLoading(true);
    try {
      await del(`/api/exams/${examId}`);
      setStatus({ message: "Exam deleted.", error: false });
      fetchMyExams();
    } catch (err) {
      console.error(err);
      setStatus({ message: "Failed to delete exam.", error: true });
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = () => {
    setEditingId(null);
    setForm(initialExamForm);
    setStatus({ message: "", error: false });
  };
  const handlePdfUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setStatus({ message: "Uploading PDF...", error: false });
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const data = await upload(`/api/exams/upload-pdf`, formData, {}, { setLoading });
      if (data && (data.url || data.file?.url)) {
        const url = data.url || data.file?.url;
        setForm((p) => ({ ...p, pdfUrl: url }));
        setStatus({ message: "PDF uploaded and attached.", error: false });
      } else {
        throw new Error(data && (data.error || JSON.stringify(data)) || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      setStatus({ message: err.message || "PDF upload failed.", error: true });
    } finally {
      setLoading(false);
    }
  };
  const [showQuestionForm, setShowQuestionForm] = import_react6.default.useState(false);
  const [selectedExamForQuestion, setSelectedExamForQuestion] = import_react6.default.useState(null);
  const [questionForm, setQuestionForm] = import_react6.default.useState({
    questionText: "",
    type: "mcq",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false }
    ],
    marks: 1,
    difficulty: "medium",
    requireWorking: false
  });
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExamForQuestion) return;
    setLoading(true);
    try {
      await post(`/api/exams/${selectedExamForQuestion}/questions`, questionForm);
      setStatus({ message: "Question added successfully.", error: false });
      setShowQuestionForm(false);
      setQuestionForm({
        questionText: "",
        type: "mcq",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false }
        ],
        marks: 1,
        difficulty: "medium",
        requireWorking: false
      });
      setSelectedExamForQuestion(null);
    } catch (err) {
      console.error(err);
      setStatus({ message: err.message || "Failed to add question.", error: true });
    } finally {
      setLoading(false);
    }
  };
  const handleOptionChange = (idx, field, value) => {
    const newOptions = [...questionForm.options];
    newOptions[idx] = { ...newOptions[idx], [field]: value };
    setQuestionForm({ ...questionForm, options: newOptions });
  };
  return /* @__PURE__ */ import_react6.default.createElement("div", { style: { padding: "30px", maxWidth: 1200, margin: "0 auto" } }, loading && /* @__PURE__ */ import_react6.default.createElement("div", { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 } }, /* @__PURE__ */ import_react6.default.createElement(Loader, null)), /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 } }, /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("h1", null, "\u270F\uFE0F Teacher Exam Management"), /* @__PURE__ */ import_react6.default.createElement("p", { style: { color: "#555" } }, "Create exams and manage your question bank for student assessments."))), /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid #e5e7eb", flexWrap: "wrap" } }, /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      onClick: () => setActiveTab("exams"),
      style: {
        padding: "12px 20px",
        background: activeTab === "exams" ? "#2563eb" : "transparent",
        color: activeTab === "exams" ? "white" : "#666",
        border: "none",
        borderRadius: "8px 8px 0 0",
        cursor: "pointer",
        fontWeight: activeTab === "exams" ? 600 : 500,
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    },
    /* @__PURE__ */ import_react6.default.createElement(Settings, { size: 18 }),
    "Exam Management"
  ), /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      onClick: () => setActiveTab("invigilation"),
      style: {
        padding: "12px 20px",
        background: activeTab === "invigilation" ? "#2563eb" : "transparent",
        color: activeTab === "invigilation" ? "white" : "#666",
        border: "none",
        borderRadius: "8px 8px 0 0",
        cursor: "pointer",
        fontWeight: activeTab === "invigilation" ? 600 : 500,
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    },
    /* @__PURE__ */ import_react6.default.createElement(ChartColumn, { size: 18 }),
    "Live Invigilation"
  )), status.message && /* @__PURE__ */ import_react6.default.createElement("div", { style: { marginBottom: 20, padding: 16, borderRadius: 10, background: status.error ? "#fee" : "#eef7ff", color: status.error ? "#a00" : "#084" } }, status.message), activeTab === "exams" && /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 } }, /* @__PURE__ */ import_react6.default.createElement("h2", { style: { margin: 0, display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ import_react6.default.createElement(Eye, { size: 18 }), " Live student monitoring"), /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" } }, /* @__PURE__ */ import_react6.default.createElement("span", { style: { fontSize: 12, color: "#475569", background: "#e2e8f0", padding: "4px 8px", borderRadius: 999 } }, summaryCounts.total, " monitored students"), /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      type: "button",
      onClick: fetchMonitoringSessions,
      style: { padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 999, background: "#fff", cursor: "pointer", fontSize: 12 }
    },
    "Refresh"
  ))), /* @__PURE__ */ import_react6.default.createElement("div", { style: { marginBottom: 12 } }, /* @__PURE__ */ import_react6.default.createElement(
    "input",
    {
      type: "text",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      placeholder: "Search by student name, admission number, or exam",
      style: { width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }
    }
  )), monitoringLoading ? /* @__PURE__ */ import_react6.default.createElement("div", null, "Loading monitoring data...") : monitoringSessions.length === 0 ? /* @__PURE__ */ import_react6.default.createElement("div", { style: { color: "#64748b" } }, "No students are currently taking your exams.") : /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1.3fr) minmax(300px, 0.8fr)" } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gap: 12 } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc" } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 12, color: "#64748b" } }, "Monitored"), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 20, fontWeight: 700 } }, summaryCounts.total)), /* @__PURE__ */ import_react6.default.createElement("div", { style: { border: "1px solid #dcfce7", borderRadius: 10, padding: 10, background: "#f0fdf4" } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 12, color: "#166534" } }, "Active"), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 20, fontWeight: 700 } }, summaryCounts.active)), /* @__PURE__ */ import_react6.default.createElement("div", { style: { border: "1px solid #fef3c7", borderRadius: 10, padding: 10, background: "#fff7ed" } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 12, color: "#92400e" } }, "Disconnected"), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 20, fontWeight: 700 } }, summaryCounts.disconnected)), /* @__PURE__ */ import_react6.default.createElement("div", { style: { border: "1px solid #e0f2fe", borderRadius: 10, padding: 10, background: "#f0f9ff" } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 12, color: "#0c4a6e" } }, "Submitted"), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 20, fontWeight: 700 } }, summaryCounts.submitted)), /* @__PURE__ */ import_react6.default.createElement("div", { style: { border: "1px solid #ede9fe", borderRadius: 10, padding: 10, background: "#f5f3ff" } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 12, color: "#5b21b6" } }, "Camera ready"), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 20, fontWeight: 700 } }, summaryCounts.cameraReady))), filteredSessions.map((session) => /* @__PURE__ */ import_react6.default.createElement("div", { key: session._id, style: { border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, background: selectedSessionId === session._id ? "#eff6ff" : "#f8fafc" } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" } }, /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontWeight: 700 } }, session.studentId?.name || "Student"), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 13, color: "#475569" } }, session.studentId?.admissionNumber ? `ADM ${session.studentId.admissionNumber}` : "Admission pending"), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 13, color: "#475569" } }, session.examId?.title || "Exam")), /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ import_react6.default.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, background: session.monitoringStatus === "Disconnected" ? "#fee2e2" : session.monitoringStatus === "Submitted" ? "#e0f2fe" : "#dcfce7", color: session.monitoringStatus === "Disconnected" ? "#991b1b" : session.monitoringStatus === "Submitted" ? "#0c4a6e" : "#166534", padding: "4px 8px", borderRadius: 999, fontSize: 12 } }, /* @__PURE__ */ import_react6.default.createElement(Activity, { size: 14 }), " ", session.monitoringStatus || "Active"), /* @__PURE__ */ import_react6.default.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, background: session.cameraEnabled ? "#ede9fe" : "#f1f5f9", color: session.cameraEnabled ? "#5b21b6" : "#475569", padding: "4px 8px", borderRadius: 999, fontSize: 12 } }, /* @__PURE__ */ import_react6.default.createElement(Eye, { size: 14 }), " ", session.cameraEnabled ? "Camera ready" : "Camera off"), /* @__PURE__ */ import_react6.default.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 4, background: "#fef3c7", color: "#92400e", padding: "4px 8px", borderRadius: 999, fontSize: 12 } }, /* @__PURE__ */ import_react6.default.createElement(Clock3, { size: 14 }), " Q", (session.currentQuestionIndex || 0) + 1))), /* @__PURE__ */ import_react6.default.createElement("div", { style: { marginTop: 8, fontSize: 13, color: "#334155" } }, "Last activity: ", session.lastActivityAt ? new Date(session.lastActivityAt).toLocaleTimeString() : "Just started"), /* @__PURE__ */ import_react6.default.createElement("div", { style: { marginTop: 8, display: "grid", gap: 8 } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 13, color: "#475569" } }, "Connection: ", /* @__PURE__ */ import_react6.default.createElement("strong", null, session.connectionStatus || "Connected"), " \xB7 Remaining time: ", /* @__PURE__ */ import_react6.default.createElement("strong", null, formatRemainingTime(session.remainingSeconds))), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 13, color: "#475569" } }, "Status: ", /* @__PURE__ */ import_react6.default.createElement("strong", null, session.currentAnswerPreview ? "Writing" : "Viewing"), " \xB7 Question ", Math.max(1, (session.currentQuestionIndex || 0) + 1)), session.currentAnswerPreview ? /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 13, color: "#334155", background: "#fff", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0" } }, "Recent answer preview: ", session.currentAnswerPreview.slice(0, 120), session.currentAnswerPreview.length > 120 ? "..." : "") : null), session.recentEvents?.length > 0 && /* @__PURE__ */ import_react6.default.createElement("div", { style: { marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" } }, session.recentEvents.map((event, index) => /* @__PURE__ */ import_react6.default.createElement("span", { key: `${session._id}-${index}`, style: { display: "inline-flex", alignItems: "center", gap: 4, background: event.severity === "critical" ? "#fee2e2" : event.severity === "warning" ? "#fef3c7" : "#e0f2fe", color: event.severity === "critical" ? "#991b1b" : event.severity === "warning" ? "#92400e" : "#0c4a6e", padding: "4px 8px", borderRadius: 999, fontSize: 12 } }, /* @__PURE__ */ import_react6.default.createElement(TriangleAlert, { size: 12 }), " ", event.eventType || "activity"))), /* @__PURE__ */ import_react6.default.createElement("div", { style: { marginTop: 10, display: "flex", justifyContent: "flex-end" } }, /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", onClick: () => setSelectedSessionId(session._id), style: { padding: "7px 12px", border: "1px solid #2563eb", borderRadius: 8, background: "#fff", color: "#2563eb", cursor: "pointer" } }, "View student details"))))), /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gap: 12 } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" } }, /* @__PURE__ */ import_react6.default.createElement("h3", { style: { margin: "0 0 8px", fontSize: 16 } }, "Student details"), selectedSession ? /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gap: 8, fontSize: 13, color: "#334155" } }, /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("strong", null, "Name:"), " ", selectedSession.studentId?.name || "Student"), /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("strong", null, "Exam:"), " ", selectedSession.examId?.title || "Exam"), /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("strong", null, "Current question:"), " ", Math.max(1, (selectedSession.currentQuestionIndex || 0) + 1)), /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("strong", null, "Last activity:"), " ", selectedSession.lastActivityAt ? new Date(selectedSession.lastActivityAt).toLocaleString() : "Just started"), /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("strong", null, "Status:"), " ", selectedSession.currentAnswerPreview ? "Writing" : "Viewing"), /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("strong", null, "Camera:"), " ", selectedSession.cameraEnabled ? "Enabled" : "Off"), selectedSession.currentAnswerPreview ? /* @__PURE__ */ import_react6.default.createElement("div", { style: { padding: 8, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" } }, /* @__PURE__ */ import_react6.default.createElement("strong", null, "Preview:"), " ", selectedSession.currentAnswerPreview.slice(0, 180), selectedSession.currentAnswerPreview.length > 180 ? "..." : "") : null) : /* @__PURE__ */ import_react6.default.createElement("div", { style: { color: "#64748b" } }, "Choose a student to inspect their live exam progress.")), /* @__PURE__ */ import_react6.default.createElement("div", { style: { border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" } }, /* @__PURE__ */ import_react6.default.createElement("h3", { style: { margin: "0 0 8px", fontSize: 16 } }, "Alert inbox"), alertInbox.length === 0 ? /* @__PURE__ */ import_react6.default.createElement("div", { style: { color: "#64748b" } }, "No alerts yet.") : /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gap: 8 } }, alertInbox.slice(0, 8).map((alert, index) => /* @__PURE__ */ import_react6.default.createElement("div", { key: `${alert.sessionId}-${index}`, style: { border: "1px solid #f1f5f9", borderRadius: 8, padding: 8, background: alert.severity === "critical" ? "#fef2f2" : alert.severity === "warning" ? "#fff7ed" : "#f8fafc" } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: alert.severity === "critical" ? "#991b1b" : alert.severity === "warning" ? "#92400e" : "#0c4a6e" } }, alert.severity), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 13, fontWeight: 600 } }, alert.studentName), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 12, color: "#475569" } }, alert.examTitle), /* @__PURE__ */ import_react6.default.createElement("div", { style: { fontSize: 12, color: "#334155", marginTop: 4 } }, alert.eventType || alert.description || "Activity alert"))))))), /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gap: 24, marginTop: 24 } }, /* @__PURE__ */ import_react6.default.createElement("section", { style: { background: "white", border: "1px solid #ddd", borderRadius: 12, padding: 20 } }, /* @__PURE__ */ import_react6.default.createElement("h2", { style: { marginBottom: 16 } }, editingId ? "Edit Exam" : "Create New Exam"), /* @__PURE__ */ import_react6.default.createElement("form", { onSubmit: handleCreateOrUpdate }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 } }, /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Title", /* @__PURE__ */ import_react6.default.createElement("input", { type: "text", name: "title", value: form.title, onChange: handleChange, required: true, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Subject", /* @__PURE__ */ import_react6.default.createElement("input", { type: "text", name: "subject", value: form.subject, onChange: handleChange, required: true, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Duration (minutes)", /* @__PURE__ */ import_react6.default.createElement("input", { type: "number", name: "duration", value: form.duration, onChange: handleChange, min: 10, required: true, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Total Marks", /* @__PURE__ */ import_react6.default.createElement("input", { type: "number", name: "totalMarks", value: form.totalMarks, onChange: handleChange, min: 10, required: true, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Pass Threshold (%)", /* @__PURE__ */ import_react6.default.createElement("input", { type: "number", name: "passThreshold", value: form.passThreshold, onChange: handleChange, min: 0, max: 100, required: true, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Proctoring Level", /* @__PURE__ */ import_react6.default.createElement("select", { name: "proctoringLevel", value: form.proctoringLevel, onChange: handleChange, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } }, /* @__PURE__ */ import_react6.default.createElement("option", { value: "light" }, "Light"), /* @__PURE__ */ import_react6.default.createElement("option", { value: "moderate" }, "Moderate"), /* @__PURE__ */ import_react6.default.createElement("option", { value: "strict" }, "Strict"))), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Trust Score Threshold", /* @__PURE__ */ import_react6.default.createElement("input", { type: "number", name: "trustScoreThreshold", value: form.trustScoreThreshold, onChange: handleChange, min: 0, max: 100, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Scheduled Start", /* @__PURE__ */ import_react6.default.createElement("input", { type: "datetime-local", name: "scheduledStart", value: form.scheduledStart, onChange: handleChange, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Scheduled End", /* @__PURE__ */ import_react6.default.createElement("input", { type: "datetime-local", name: "scheduledEnd", value: form.scheduledEnd, onChange: handleChange, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } }))), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8, marginTop: 16 } }, "Description", /* @__PURE__ */ import_react6.default.createElement("textarea", { name: "description", value: form.description, onChange: handleChange, rows: 4, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8, marginTop: 16 } }, "Instructions", /* @__PURE__ */ import_react6.default.createElement("textarea", { name: "instructions", value: form.instructions, onChange: handleChange, rows: 4, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8, marginTop: 16 } }, "PDF URL", /* @__PURE__ */ import_react6.default.createElement("input", { type: "text", name: "pdfUrl", value: form.pdfUrl, onChange: handleChange, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 }, placeholder: "Enter link to exam PDF" })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8, marginTop: 8 } }, "Or upload PDF", /* @__PURE__ */ import_react6.default.createElement("input", { type: "file", accept: "application/pdf", onChange: (e) => handlePdfUpload(e.target.files && e.target.files[0]) })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8, marginTop: 16 } }, "Allowed Materials", /* @__PURE__ */ import_react6.default.createElement("input", { type: "text", name: "allowedMaterials", value: form.allowedMaterials, onChange: handleChange, placeholder: "e.g. calculator, reference sheet", style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 } }, /* @__PURE__ */ import_react6.default.createElement("button", { type: "submit", style: { padding: "12px 28px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, editingId ? "Update Exam" : "Create Exam"), editingId && /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", onClick: handleCancel, style: { padding: "12px 28px", background: "#6b7280", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, "Cancel")))), /* @__PURE__ */ import_react6.default.createElement("section", { style: { background: "white", border: "1px solid #ddd", borderRadius: 12, padding: 20 } }, /* @__PURE__ */ import_react6.default.createElement("h2", { style: { marginBottom: 16 } }, "My Exams"), exams.length === 0 ? /* @__PURE__ */ import_react6.default.createElement("p", { style: { color: "#555" } }, "No exams created yet. Use the form above to add a new exam.") : /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gap: 16 } }, exams.map((exam) => /* @__PURE__ */ import_react6.default.createElement("div", { key: exam._id, style: { border: "1px solid #e5e7eb", borderRadius: 10, padding: 18, background: "#fafafa" } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 } }, /* @__PURE__ */ import_react6.default.createElement("div", null, /* @__PURE__ */ import_react6.default.createElement("h3", { style: { margin: 0 } }, exam.title), /* @__PURE__ */ import_react6.default.createElement("p", { style: { margin: "8px 0", color: "#555" } }, exam.subject || "No subject"), /* @__PURE__ */ import_react6.default.createElement("p", { style: { margin: 0, color: "#6b7280", fontSize: 14 } }, "Duration: ", exam.duration, " min \xB7 Marks: ", exam.totalMarks, " \xB7 Enrolled: ", exam.enrolledStudents?.length || 0)), /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" } }, /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", onClick: () => {
    setSelectedExamForQuestion(exam._id);
    setShowQuestionForm(true);
  }, style: { padding: "10px 18px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, "+ Add Question"), /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", onClick: () => setReviewExam(exam), style: { padding: "10px 18px", background: "#6366f1", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, "Review Working"), /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", onClick: () => handleEdit(exam), style: { padding: "10px 18px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, "Edit"), /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", onClick: () => handleDelete(exam._id), style: { padding: "10px 18px", background: "#dc2626", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, "Delete"))), exam.instructions && /* @__PURE__ */ import_react6.default.createElement("p", { style: { marginTop: 16, color: "#4b5563" } }, exam.instructions))))))), activeTab === "invigilation" && /* @__PURE__ */ import_react6.default.createElement("div", null, exams.length === 0 ? /* @__PURE__ */ import_react6.default.createElement("div", { style: { padding: 20, background: "white", borderRadius: 12, border: "1px solid #ddd", textAlign: "center", color: "#666" } }, /* @__PURE__ */ import_react6.default.createElement("p", null, "No exams available for monitoring. Please create an exam first.")) : /* @__PURE__ */ import_react6.default.createElement(LiveInvigilation_default, { examId: exams[0]?._id })), showQuestionForm && /* @__PURE__ */ import_react6.default.createElement("section", { style: { background: "white", border: "2px solid #16a34a", borderRadius: 12, padding: 20 } }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 } }, /* @__PURE__ */ import_react6.default.createElement("h2", { style: { margin: 0 } }, "Add Question to Exam"), /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", onClick: () => {
    setShowQuestionForm(false);
    setSelectedExamForQuestion(null);
  }, style: { padding: "8px 16px", background: "#6b7280", color: "white", border: "none", borderRadius: 6, cursor: "pointer" } }, "Close")), /* @__PURE__ */ import_react6.default.createElement("form", { onSubmit: handleAddQuestion }, /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gap: 16 } }, /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Question Text", /* @__PURE__ */ import_react6.default.createElement("textarea", { value: questionForm.questionText, onChange: (e) => setQuestionForm({ ...questionForm, questionText: e.target.value }), required: true, rows: 3, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Question Type", /* @__PURE__ */ import_react6.default.createElement("select", { value: questionForm.type, onChange: (e) => setQuestionForm({ ...questionForm, type: e.target.value }), style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } }, /* @__PURE__ */ import_react6.default.createElement("option", { value: "mcq" }, "Multiple Choice"), /* @__PURE__ */ import_react6.default.createElement("option", { value: "short" }, "Short Answer"), /* @__PURE__ */ import_react6.default.createElement("option", { value: "essay" }, "Essay"))), questionForm.type === "mcq" && /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gap: 12 } }, /* @__PURE__ */ import_react6.default.createElement("label", { style: { fontWeight: "bold", color: "#333" } }, "Options"), questionForm.options.map((opt, idx) => /* @__PURE__ */ import_react6.default.createElement("div", { key: idx, style: { display: "grid", gap: 8, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8, background: "#f9fafb" } }, /* @__PURE__ */ import_react6.default.createElement(
    "input",
    {
      type: "text",
      placeholder: `Option ${idx + 1}`,
      value: opt.text,
      onChange: (e) => handleOptionChange(idx, "text", e.target.value),
      style: { padding: 10, border: "1px solid #ccc", borderRadius: 6 },
      required: true
    }
  ), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "flex", alignItems: "center", gap: 8 } }, /* @__PURE__ */ import_react6.default.createElement("input", { type: "checkbox", checked: opt.isCorrect, onChange: (e) => handleOptionChange(idx, "isCorrect", e.target.checked) }), "Mark as correct answer")))), /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 } }, /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Marks", /* @__PURE__ */ import_react6.default.createElement("input", { type: "number", value: questionForm.marks, onChange: (e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) }), min: 1, required: true, style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } })), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Difficulty", /* @__PURE__ */ import_react6.default.createElement("select", { value: questionForm.difficulty, onChange: (e) => setQuestionForm({ ...questionForm, difficulty: e.target.value }), style: { padding: 12, border: "1px solid #ccc", borderRadius: 8 } }, /* @__PURE__ */ import_react6.default.createElement("option", { value: "easy" }, "Easy"), /* @__PURE__ */ import_react6.default.createElement("option", { value: "medium" }, "Medium"), /* @__PURE__ */ import_react6.default.createElement("option", { value: "hard" }, "Hard")))), /* @__PURE__ */ import_react6.default.createElement("label", { style: { display: "grid", gap: 8 } }, "Require Working Upload", /* @__PURE__ */ import_react6.default.createElement("input", { type: "checkbox", checked: questionForm.requireWorking, onChange: (e) => setQuestionForm({ ...questionForm, requireWorking: e.target.checked }) }))), /* @__PURE__ */ import_react6.default.createElement("div", { style: { display: "flex", gap: 12, marginTop: 20 } }, /* @__PURE__ */ import_react6.default.createElement("button", { type: "submit", style: { padding: "12px 28px", background: "#16a34a", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, "Save Question"), /* @__PURE__ */ import_react6.default.createElement("button", { type: "button", onClick: () => {
    setShowQuestionForm(false);
    setSelectedExamForQuestion(null);
  }, style: { padding: "12px 28px", background: "#6b7280", color: "white", border: "none", borderRadius: 8, cursor: "pointer" } }, "Cancel")))), reviewExam && /* @__PURE__ */ import_react6.default.createElement(TeacherExamReview, { exam: reviewExam, onClose: () => setReviewExam(null) }));
}
export {
  TeacherExamManagement as default
};
/*! Bundled license information:

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/activity.js:
lucide-react/dist/esm/icons/camera-off.js:
lucide-react/dist/esm/icons/camera.js:
lucide-react/dist/esm/icons/chart-column.js:
lucide-react/dist/esm/icons/circle-alert.js:
lucide-react/dist/esm/icons/circle-check-big.js:
lucide-react/dist/esm/icons/circle-check.js:
lucide-react/dist/esm/icons/circle-x.js:
lucide-react/dist/esm/icons/clock-3.js:
lucide-react/dist/esm/icons/clock.js:
lucide-react/dist/esm/icons/download.js:
lucide-react/dist/esm/icons/eye.js:
lucide-react/dist/esm/icons/file-text.js:
lucide-react/dist/esm/icons/pause.js:
lucide-react/dist/esm/icons/pencil.js:
lucide-react/dist/esm/icons/rotate-ccw.js:
lucide-react/dist/esm/icons/settings.js:
lucide-react/dist/esm/icons/trending-up.js:
lucide-react/dist/esm/icons/triangle-alert.js:
lucide-react/dist/esm/icons/x.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.453.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
