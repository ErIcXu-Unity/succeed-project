# 测试目录 / Test Directory

本目录包含UNSW逃脱室教育平台的所有测试文件，采用统一的测试架构。

## 📁 目录结构 / Directory Structure

```
test/
├── backend/                   # 后端测试
│   ├── conftest.py           # Pytest配置和fixtures
│   ├── test_auth.py          # 认证功能测试
│   ├── test_tasks.py         # 任务管理测试
│   ├── test_questions.py     # 问题管理测试
│   ├── test_models.py        # 数据模型测试
│   └── test_integration.py   # 集成测试
├── frontend/                  # 前端测试
│   ├── Login.test.js         # 登录组件测试
│   ├── QuestionCreateModal.test.js # 问题创建模态框测试
│   └── ...更多组件测试
├── pytest.ini               # Pytest配置文件
└── README.md                 # 本文件
```

## 🚀 快速开始 / Quick Start

### 运行所有后端测试
```bash
cd test
pytest backend
```

### 运行特定测试文件
```bash
cd test
pytest backend/test_auth.py
```

### 生成覆盖率报告
```bash
cd test
pytest --cov=../backend --cov-report=html:../htmlcov backend
```

### 使用测试运行脚本（推荐）
```bash
# 从项目根目录运行
python run_tests.py --backend
python run_tests.py --frontend
python run_tests.py --all
```

## 📝 测试说明 / Test Documentation

### 后端测试 / Backend Tests

- **test_auth.py**: 用户认证功能测试
  - 学生注册和登录
  - 密码验证
  - 权限控制

- **test_tasks.py**: 任务管理测试
  - 任务CRUD操作
  - 任务权限验证
  - 任务-问题关联

- **test_questions.py**: 问题管理测试
  - 6种问题类型创建
  - 问题数据验证
  - 问题-任务关联

- **test_models.py**: 数据模型测试
  - 模型创建和验证
  - 数据关系测试
  - 约束条件验证

- **test_integration.py**: 集成测试
  - 完整用户流程
  - 系统间交互
  - 错误处理流程

### 前端测试 / Frontend Tests

- **Login.test.js**: 登录组件测试
  - 表单渲染和交互
  - API调用和响应处理
  - 导航和错误处理

- **QuestionCreateModal.test.js**: 问题创建模态框测试
  - 多种问题类型支持
  - 表单验证
  - 模态框交互

## 🛠️ 开发指南 / Development Guide

### 添加新的后端测试

1. 在 `backend/` 目录下创建新的测试文件，命名为 `test_*.py`
2. 确保导入必要的模块：
```python
import pytest
import json
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'backend'))

from models import db, YourModel
```

3. 使用conftest.py中定义的fixtures
4. 遵循AAA模式（Arrange, Act, Assert）

### 添加新的前端测试

1. 在 `frontend/` 目录下创建新的测试文件，命名为 `*.test.js`
2. 导入必要的测试工具和组件：
```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import YourComponent from '../../src/components/YourComponent';
```

3. 模拟必要的依赖（如fetch、路由等）
4. 编写描述性的测试用例

## 🔧 配置文件 / Configuration Files

### pytest.ini
Pytest的主要配置文件，定义了：
- 测试路径
- 覆盖率设置
- 测试标记
- 报告格式

### conftest.py
包含所有的pytest fixtures：
- 应用程序实例
- 测试客户端
- 测试数据（学生、教师、任务、问题）
- 认证头部

## 📊 测试标记 / Test Markers

使用pytest标记来分类测试：

```bash
# 运行快速测试
pytest -m "not slow" backend

# 运行集成测试
pytest -m "integration" backend

# 运行单元测试
pytest -m "unit" backend

# 运行API测试
pytest -m "api" backend
```

## 🐛 调试技巧 / Debugging Tips

### 查看详细输出
```bash
pytest -v -s backend/test_auth.py
```

### 只运行失败的测试
```bash
pytest --lf backend
```

### 进入调试模式
```bash
pytest --pdb backend/test_auth.py::TestLogin::test_successful_login
```

### 查看覆盖率详情
```bash
pytest --cov=../backend --cov-report=term-missing backend
```

## 🚨 注意事项 / Important Notes

1. **路径依赖**: 所有后端测试都需要正确设置Python路径以导入项目模块
2. **数据库隔离**: 每个测试使用独立的SQLite内存数据库
3. **Mock策略**: 前端测试需要mock外部依赖（API调用、路由等）
4. **测试数据**: 使用fixtures创建可重用的测试数据
5. **清理机制**: 测试完成后自动清理数据和状态

## 📚 更多信息 / More Information

详细的测试文档请参考项目根目录下的 `TESTING.md` 文件。

---

**维护者**: UNSW逃脱室教育平台开发团队  
**最后更新**: 2024年 