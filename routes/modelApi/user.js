const express = require("express");
const router = express.Router();
const db = require("../../config/db"); // 调用你的 MySQL 连接池
const svgCaptcha = require("svg-captcha"); // 验证码
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// JWT 验证中间件
const authenticateToken = (req, res, next) => {
  try {
    console.log('=== JWT 验证中间件调试信息 ===');
    console.log('请求头信息:', {
      'user-agent': req.headers['user-agent'],
      'cookie': req.headers.cookie,
      'authorization': req.headers.authorization
    });
    console.log('req.cookies:', req.cookies);
    console.log('req.session:', req.session);
    
    // 从多个地方尝试获取 token
    let token = req.cookies?.token;
    
    // 如果 cookie 中没有，尝试从 Authorization header 获取
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    // 如果还是没有，尝试从 session 获取
    if (!token && req.session && req.session.user && req.session.user.token) {
      token = req.session.user.token;
    }
    
    console.log('Token获取结果:', {
      cookie: req.cookies?.token,
      authorization: req.headers.authorization,
      sessionToken: req.session?.user?.token,
      finalToken: token ? `${token.substring(0, 20)}...` : null
    });

    if (!token) {
      console.log('❌ 未找到有效的token');
      return res.status(401).json({ code: -1, message: "未提供访问令牌" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        console.error('❌ JWT 验证失败:', err.message);
        return res.status(403).json({ code: -1, message: "令牌无效或已过期" });
      }
      req.user = user;
      console.log('✅ JWT 验证成功:', user);
      next();
    });
  } catch (error) {
    console.error("❌ Token verification error:", error);
    return res.status(500).json({ code: 500, message: "服务器内部错误" });
  }
};

// 2. 验证码接口
router.get("/captcha", (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4, // 验证码长度
    ignoreChars: "0o1i", // 忽略的字符
    noise: 1, // 干扰线数量
    color: true, // 是否有颜色
    background: "#f0f0f0", // 背景颜色
  });
  req.session.captcha = captcha.text; // 将验证码文本存储在会话中
  console.log("captcha.text:", captcha.text);
  // 明确告诉客户端这是 SVG
  res.set("Content-Type", "image/svg+xml");
  res.status(200).send(captcha.data);
});

// 登录接口
router.post("/login", async (req, res) => {
  const { username, password, captcha } = req.body;
  // 1. 验证验证码
  console.log("验证码:", captcha);
  console.log("会话中的验证码:", req.session.captcha);

  if (
    !captcha ||
    !req.session.captcha ||
    captcha.toLowerCase() !== req.session.captcha.toLowerCase()
  ) {
    return res.status(400).json({ code: -1, msg: "验证码不正确" });
  }
  delete req.session.captcha; // 一次性使用

  try {
    // 2. 查询用户
    const [rows] = await db.query(
      "SELECT id, username, password FROM user WHERE username=?",
      [username]
    );
    if (rows.length === 0) {
      return res.status(200).json({ code: -1, msg: "用户不存在或密码错误" });
    }
    const user = rows[0];
    console.log("查询到的用户:", user);
    // 3. 验证密码（假设用 bcrypt 存储）
    const match = await bcrypt.compare(password, user.password);
    console.log("输入的明文密码：", password);
    console.log("数据库里的哈希密码：", user.password);
    console.log("match:", match);
    if (!match) {
      return res.status(200).json({ code: -2, msg: "用户不存在或密码错误" });
    }

    // 生成 JWT token
    const payload = { sub: user.id, username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    
    console.log('=== 登录成功，准备设置Cookie ===');
    console.log('生成的token:', `${token.substring(0, 20)}...`);
    console.log('Cookie配置:', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60 * 1000
    });
    
    // 将 token 写入 HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // 开发环境强制设置为false
      sameSite: "lax",
      path: "/",
      maxAge: 2 * 60 * 60 * 1000,
    });
    
    // 4. 登录成功，写入会话
    req.session.user = { id: user.id, username: user.username, token };
    
    // 保存session
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('Session保存失败:', saveErr);
      } else {
        console.log('✅ Session保存成功');
      }
    });
    
    console.log('✅ 登录成功，已设置cookie和session:', {
      userId: user.id,
      username: user.username,
      tokenSet: !!token,
      sessionId: req.sessionID
    });

    res.json({ 
      success: true, 
      message: "登录成功", 
      data: { 
        token,
        user: {
          id: user.id,
          username: user.username
        }
      } 
    });
  } catch (err) {
    console.error("❌ 登录失败：", err);
    res.status(500).json({ code: 500, error: "服务器内部错误" });
  }
});
router.get("/getInfo", authenticateToken, (req, res) => {
  try {
    // 返回用户信息
    return res.status(200).json({
      code: 200,
      message: "获取用户信息成功",
      data: {
        id: req.user.sub,
        username: req.user.username,
        avatar:
          "http://tangzhe123-com.oss-cn-shenzhen.aliyuncs.com/public/62af03d1b2aeb.jpg",
        super: 1,
        role: {
          id: 2,
          name: "超级管理员",
        },
        menus: [
          {
            id: 10,
            rule_id: 5,
            status: 1,
            create_time: "2019-08-11 13:37:02",
            update_time: "2021-12-21 20:21:23",
            name: "后台面板",
            desc: "index",
            frontpath: "/",
            condition: null,
            menu: 1,
            order: 20,
            icon: "home-filled",
            method: "GET",
            child: [],
          },
          {
            id: 6,
            rule_id: 0,
            status: 1,
            create_time: "2019-08-11 13:36:36",
            update_time: "2021-12-21 19:37:11",
            name: "商品管理",
            desc: "shop_goods_list",
            frontpath: null,
            condition: null,
            menu: 1,
            order: 2,
            icon: "shopping-bag",
            method: "GET",
            child: [
              {
                id: 13,
                rule_id: 6,
                status: 1,
                create_time: "2019-12-28 13:42:13",
                update_time: "2021-12-21 20:21:42",
                name: "商品管理",
                desc: "shop_goods_list",
                frontpath: "/goods/list",
                condition: "",
                menu: 1,
                order: 20,
                icon: "shopping-cart-full",
                method: "GET",
                child: [],
              },
              {
                id: 14,
                rule_id: 6,
                status: 1,
                create_time: "2019-12-28 13:44:00",
                update_time: "2021-12-21 20:22:00",
                name: "分类管理",
                desc: "shop_category_list",
                frontpath: "/category/list",
                condition: "",
                menu: 1,
                order: 20,
                icon: "menu",
                method: "GET",
                child: [],
              },
              {
                id: 15,
                rule_id: 6,
                status: 1,
                create_time: "2019-12-28 13:44:32",
                update_time: "2021-12-21 20:22:11",
                name: "规格管理",
                desc: "shop_sku_list",
                frontpath: "/skus/list",
                condition: "",
                menu: 1,
                order: 20,
                icon: "aim",
                method: "GET",
                child: [],
              },
              {
                id: 157,
                rule_id: 6,
                status: 1,
                create_time: "2021-06-12 21:57:02",
                update_time: "2021-12-21 20:22:52",
                name: "优惠券管理",
                desc: "shop_coupon_list",
                frontpath: "/coupon/list",
                condition: "",
                menu: 1,
                order: 50,
                icon: "postcard",
                method: "GET",
                child: [],
              },
            ],
          },
          {
            id: 13,
            rule_id: 0,
            status: 1,
            create_time: "2021-12-21 19:38:21",
            update_time: "2021-12-21 19:38:21",
            name: "低代码tuiPlus",
            desc: "",
            frontpath: "",
            condition: "",
            menu: 1,
            order: 3,
            icon: "user",
            method: "GET",
            child: [
              {
                id: 21,
                rule_id: 173,
                status: 1,
                create_time: "2019-12-28 13:46:45",
                update_time: "2021-12-21 20:22:35",
                name: "基础组件",
                desc: "light_baseComponents_list",
                frontpath: "/light/baseComponents",
                condition: "",
                menu: 1,
                order: 20,
                icon: "user-filled",
                method: "GET",
                child: [],
              },
              {
                id: 22,
                rule_id: 173,
                status: 1,
                create_time: "2019-12-28 13:46:59",
                update_time: "2021-12-21 20:22:44",
                name: "高级组件",
                desc: "light_highComponents_list",
                frontpath: "/light/highComponents",
                condition: "",
                menu: 1,
                order: 20,
                icon: "data-analysis",
                method: "GET",
                child: [],
              },
            ],
          },
          {
            id: 173,
            rule_id: 0,
            status: 1,
            create_time: "2021-12-21 19:38:21",
            update_time: "2021-12-21 19:38:21",
            name: "用户管理",
            desc: "",
            frontpath: "",
            condition: "",
            menu: 1,
            order: 3,
            icon: "user",
            method: "GET",
            child: [
              {
                id: 21,
                rule_id: 173,
                status: 1,
                create_time: "2019-12-28 13:46:45",
                update_time: "2021-12-21 20:22:35",
                name: "用户管理",
                desc: "user_user-list_list",
                frontpath: "/user/list",
                condition: "",
                menu: 1,
                order: 20,
                icon: "user-filled",
                method: "GET",
                child: [],
              },
              {
                id: 22,
                rule_id: 173,
                status: 1,
                create_time: "2019-12-28 13:46:59",
                update_time: "2021-12-21 20:22:44",
                name: "会员等级",
                desc: "user_user-level_list",
                frontpath: "/level/list",
                condition: "",
                menu: 1,
                order: 20,
                icon: "data-analysis",
                method: "GET",
                child: [],
              },
            ],
          },
          {
            id: 7,
            rule_id: 0,
            status: 1,
            create_time: "2019-08-11 13:36:40",
            update_time: "2021-12-21 19:37:18",
            name: "订单管理",
            desc: "order_order_list",
            frontpath: null,
            condition: null,
            menu: 1,
            order: 4,
            icon: "message-box",
            method: "GET",
            child: [
              {
                id: 18,
                rule_id: 7,
                status: 1,
                create_time: "2019-12-28 13:45:42",
                update_time: "2021-12-21 20:23:02",
                name: "订单管理",
                desc: "order_order_list",
                frontpath: "/order/list",
                condition: "",
                menu: 1,
                order: 1,
                icon: "reading",
                method: "GET",
                child: [],
              },
              {
                id: 17,
                rule_id: 7,
                status: 1,
                create_time: "2019-12-28 13:44:56",
                update_time: "2021-12-21 20:22:26",
                name: "评论管理",
                desc: "shop_comment_list",
                frontpath: "/comment/list",
                condition: "",
                menu: 1,
                order: 20,
                icon: "comment",
                method: "GET",
                child: [],
              },
            ],
          },
          {
            id: 8,
            rule_id: 0,
            status: 1,
            create_time: "2019-08-11 13:36:43",
            update_time: "2021-12-21 19:37:25",
            name: "管理员管理",
            desc: "user_user-list_list",
            frontpath: null,
            condition: null,
            menu: 1,
            order: 5,
            icon: "management",
            method: "GET",
            child: [
              {
                id: 25,
                rule_id: 8,
                status: 1,
                create_time: "2019-12-28 13:47:39",
                update_time: "2021-12-21 20:23:53",
                name: "管理员管理",
                desc: "set_manager",
                frontpath: "/manager/list",
                condition: "",
                menu: 1,
                order: 20,
                icon: "coordinate",
                method: "GET",
                child: [],
              },
              {
                id: 27,
                rule_id: 8,
                status: 1,
                create_time: "2020-01-03 21:05:50",
                update_time: "2021-12-21 20:24:04",
                name: "权限管理",
                desc: "",
                frontpath: "/access/list",
                condition: "",
                menu: 1,
                order: 20,
                icon: "connection",
                method: "GET",
                child: [],
              },
              {
                id: 33,
                rule_id: 8,
                status: 1,
                create_time: "2020-01-04 18:15:47",
                update_time: "2021-12-21 20:18:11",
                name: "角色管理",
                desc: "",
                frontpath: "/role/list",
                condition: "",
                menu: 1,
                order: 20,
                icon: "histogram",
                method: "GET",
                child: [],
              },
            ],
          },
          {
            id: 9,
            rule_id: 0,
            status: 1,
            create_time: "2019-08-11 13:36:50",
            update_time: "2021-12-21 19:10:15",
            name: "系统设置",
            desc: "set_base",
            frontpath: null,
            condition: null,
            menu: 1,
            order: 6,
            icon: "setting",
            method: "GET",
            child: [
              {
                id: 23,
                rule_id: 9,
                status: 1,
                create_time: "2019-12-28 13:47:15",
                update_time: "2021-12-21 20:23:12",
                name: "基础设置",
                desc: "set_base",
                frontpath: "/setting/base",
                condition: "",
                menu: 1,
                order: 19,
                icon: "baseball",
                method: "GET",
                child: [],
              },
              {
                id: 26,
                rule_id: 9,
                status: 1,
                create_time: "2019-12-28 13:47:57",
                update_time: "2021-12-21 20:23:22",
                name: "交易设置",
                desc: "set_payment",
                frontpath: "/setting/buy",
                condition: "",
                menu: 1,
                order: 20,
                icon: "credit-card",
                method: "GET",
                child: [],
              },
              {
                id: 24,
                rule_id: 9,
                status: 1,
                create_time: "2019-12-28 13:47:27",
                update_time: "2021-12-21 20:20:53",
                name: "物流设置",
                desc: "set_express",
                frontpath: "/setting/ship",
                condition: "",
                menu: 1,
                order: 21,
                icon: "bicycle",
                method: "GET",
                child: [],
              },
            ],
          },
          {
            id: 177,
            rule_id: 0,
            status: 1,
            create_time: "2022-06-18 00:12:10",
            update_time: "2022-06-18 00:12:10",
            name: "分销模块",
            desc: null,
            frontpath: "",
            condition: "",
            menu: 1,
            order: 7,
            icon: "shopping-cart",
            method: "GET",
            child: [
              {
                id: 178,
                rule_id: 177,
                status: 1,
                create_time: "2022-06-18 00:14:58",
                update_time: "2022-06-18 00:14:58",
                name: "分销员管理",
                desc: null,
                frontpath: "/distribution/index",
                condition: "",
                menu: 1,
                order: 50,
                icon: "user-filled",
                method: "GET",
                child: [],
              },
              {
                id: 179,
                rule_id: 177,
                status: 1,
                create_time: "2022-06-18 00:15:25",
                update_time: "2022-06-18 00:15:25",
                name: "分销设置",
                desc: null,
                frontpath: "/distribution/setting",
                condition: "",
                menu: 1,
                order: 50,
                icon: "set-up",
                method: "GET",
                child: [],
              },
            ],
          },
          {
            id: 172,
            rule_id: 0,
            status: 1,
            create_time: "2021-12-21 19:10:34",
            update_time: "2021-12-21 19:10:47",
            name: "其他模块",
            desc: "",
            frontpath: "",
            condition: "",
            menu: 1,
            order: 8,
            icon: "mostly-cloudy",
            method: "GET",
            child: [
              {
                id: 11,
                rule_id: 172,
                status: 1,
                create_time: "2019-12-28 13:38:32",
                update_time: "2021-12-21 20:23:43",
                name: "图库管理",
                desc: "image",
                frontpath: "/image/list",
                condition: null,
                menu: 1,
                order: 20,
                icon: "picture-filled",
                method: "GET",
                child: [],
              },
              {
                id: 149,
                rule_id: 172,
                status: 1,
                create_time: "2021-06-11 23:21:24",
                update_time: "2021-12-21 20:23:33",
                name: "公告管理",
                desc: "set_notice",
                frontpath: "/notice/list",
                condition: "",
                menu: 1,
                order: 50,
                icon: "notification",
                method: "GET",
                child: [],
              },
            ],
          },
        ],
        ruleNames: [
          "createRule,POST",
          "updateRule,POST",
          "deleteRule,POST",
          "getRuleList,GET",
          "updateRuleStatus,POST",
          "createRole,POST",
          "updateRole,POST",
          "deleteRole,POST",
          "getRoleList,GET",
          "updateRoleStatus,POST",
          "getGoodsList,GET",
          "getCurrentImageList,GET",
          "getImageClassList,GET",
          "createImageClass,POST",
          "updateImageClass,POST",
          "deleteImageClass,POST",
          "uploadImage,POST",
          "deleteImage,POST",
          "updateImage,POST",
          "getCategoryList,GET",
          "createCategory,POST",
          "sortCategory,POST",
          "updateCategory,POST",
          "updateCategoryStatus,POST",
          "deleteCategory,DELETE",
          "getSkusList,GET",
          "createSkus,POST",
          "deleteSkus,POST",
          "updateSkus,POST",
          "updateSkusStatus,POST",
          "getOrderList,GET",
          "deleteOrder,POST",
          "shipOrder,POST",
          "refundOrder,POST",
          "exportOrder,POST",
          "getCommentList,GET",
          "reviewComment,POST",
          "updateCommentStatus,POST",
          "getUserList,GET",
          "createUser,POST",
          "updateUser,POST",
          "updateUserStatus,POST",
          "deleteUser,POST",
          "getUserLevelList,GET",
          "createUserLevel,POST",
          "updateUserLevel,POST",
          "updateUserLevelStatus,POST",
          "deleteUserLevel,POST",
          "deleteManager,POST",
          "getManagerList,GET",
          "createManager,POST",
          "updateManager,POST",
          "updateManagerStatus,POST",
          "getSysSetting,GET",
          "sysconfigUpload,POST",
          "setSysSetting,POST",
          "getSysSetting,GET",
          "setSysSetting,GET",
          "readGoods,GET",
          "updateGoodsSkus,POST",
          "setGoodsBanner,POST",
          "restoreGoods,POST",
          "destroyGoods,POST",
          "deleteGoods,POST",
          "updateGoodsStatus,POST",
          "createGoods,POST",
          "updateGoods,POST",
          "checkGoods,POST",
          "createGoodsSkusCard,POST",
          "sortGoodsSkusCard,POST",
          "updateGoodsSkusCard,POST",
          "deleteGoodsSkusCard,POST",
          "createGoodsSkusCardValue,POST",
          "updateGoodsSkusCardValue,POST",
          "deleteGoodsSkusCardValue,POST",
          "getNoticeList,GET",
          "createNotice,POST",
          "updateNotice,POST",
          "deleteNotice,POST",
          "getCouponList,GET",
          "createCoupon,POST",
          "updateCoupon,POST",
          "updateCouponStatus,POST",
          "getCategoryGoods,GET",
          "connectCategoryGoods,POST",
          "deleteCategoryGoods,POST",
          "getStatistics1,GET",
          "getStatistics2,GET",
          "getStatistics3,GET",
          "setRoleRules,POST",
          "deleteCoupon,POST",
          "getShipInfo,GET",
          "getExpressCompanyList,GET",
          "getAgentStatistics,GET",
          "getAgentList,GET",
          "getUserBillList,GET",
          "getDistributionSetting,GET",
          "setDistributionSetting,POST",
        ],
      },
    });
  } catch (error) {
    console.error("获取用户信息失败：", error);
    return res.status(500).json({
      code: 500,
      message: "服务器内部错误",
      error: error.message,
    });
  }
});
// 注册接口：把密码哈希后存库
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "用户名和密码必填" });
  }
  // 1. 检查用户名是否已存在
  const [rows] = await db.query("SELECT id FROM user WHERE username=?", [
    username,
  ]);
  if (rows.length > 0) {
    return res.status(400).json({ error: "用户名已存在" });
  }
  try {
    // 1. 生成哈希（10 轮 salt）
    const hash = await bcrypt.hash(password, 10);
    // 2. 存入数据库
    await db.query("INSERT INTO user (username, password) VALUES (?, ?)", [
      username,
      hash,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "注册失败" });
  }
});
// 登出接口
router.post("/logout", (req, res) => {
  // 清除会话
  req.session.destroy((err) => {
    if (err) {
      console.error("登出失败：", err);
      return res.status(200).json({ error: "登出失败" });
    }
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/", // 确保清除的路径与设置时一致
    });
    res.json({ success: true, message: "登出成功" });
  });
});

module.exports = router;
