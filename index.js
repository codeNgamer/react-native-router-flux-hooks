import { Reducer, ActionConst } from 'react-native-router-flux';
import _ from 'lodash';

const keyEvents = [
  ActionConst.REFRESH,
  ActionConst.FOCUS,
];

const attachHandlers = (baseClass) => {
  _.forEach(keyEvents, keyEvent => {
    const actionName = _.camelCase(_.findKey(ActionConst, keyEvent));
    const registerHookName = `register${actionName}Hook`;
    const unregisterHookName = `unregister${actionName}Hook`;

    baseClass.prototype[registerHookName] = component => {
      const handlerName = `handleNavigationScene${actionName}`;
      if (component[handlerName] === undefined) {
        throw `Provided component does not define ${handlerName}`;
      }

      const boundedHandler = component.[handlerName].bind(component);
      const { sceneKey } = component.props;
      const hook = {  };
      hook[keyEvent] = boundedHandler; 
      this._addHook(hook, sceneKey);
    };

    baseClass.prototype[unregisterHookName] = component => {
      const { sceneKey } = component.props;
      this._removeHook(keyEvent, sceneKey);
    }
  });
};

class NavigationStateHandler {
  constructor() {
    this._hooks = { };
  }

  _addHook(hook, sceneKey) {
    this._hooks[sceneKey] = this._hooks[sceneKey] || {};
    this._hooks[sceneKey] = { ...this._hooks[sceneKey], ...hook };
  }

  _removeHook(hookName, sceneKey) {
    this._hooks[sceneKey] = _.omit(this.hooks[sceneKey], hookName);
  }

  getReducer(params) {
    const defaultReducer = Reducer(params);
    const isKeyEvent = (type) => _.includes(keyEvents, type);

    return (state, action) => {
      if (action.scene && isKeyEvent(action.type)) {
        const sceneHandler = this._hooks[action.scene.sceneKey];
        if (sceneHandler) {
          sceneHandler[action.type]();
        }
      }

      return defaultReducer(state, action);
    }
  }
}

export default attachHandlers(NavigationStateHandler);
