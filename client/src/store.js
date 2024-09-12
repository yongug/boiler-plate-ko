// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './reducers'; // rootReducer를 임포트 (리듀서 모음)

// 스토어 생성, 기본적으로 thunk는 내장되어 있습니다.
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([promiseMiddleware]),
});

export default store;
