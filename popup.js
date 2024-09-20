// Запускаем код, когда DOM загружен
document.addEventListener('DOMContentLoaded', function () {
    
    // Находим все элементы вкладок и контент
    const tabs = document.querySelectorAll('#tabs .nav-link');
    const contents = document.querySelectorAll('.tab-content');

    // Для каждой вкладки устанавливаем обработчик клика
    tabs.forEach(tab => {
        tab.addEventListener('click', function (event) {
            event.preventDefault();
            const targetTab = tab.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Функция для сбора мета-тегов и заголовков
    function getRelevantTags() {
        const metaTags = {};
        const metaElements = [...document.getElementsByTagName('meta')];
        metaElements.forEach(tag => {
            const name = tag.getAttribute('name');
            const property = tag.getAttribute('property');
            const content = tag.getAttribute('content');

            if (name === 'description') metaTags['description'] = content;
            if (name === 'robots') metaTags['robots'] = content;
            if (name === 'keywords') metaTags['keywords'] = content;
            if (name === 'apple-mobile-web-app-capable') metaTags['apple-mobile-web-app-capable'] = content;
            if (property === 'og:locale') metaTags['locale'] = content;
            if (property === 'og:url') metaTags['url'] = content;
        });

        const titleElement = document.querySelector('title');
        if (titleElement) {
            metaTags['title'] = titleElement.textContent;
        }

        const h1Elements = [...document.getElementsByTagName('h1')];
        if (h1Elements.length > 0) {
            metaTags['h1'] = h1Elements.map(h1 => h1.textContent).join(', ');
        }

        const sitemapElement = document.querySelector('link[rel="sitemap"]');
        metaTags['sitemap'] = sitemapElement ? sitemapElement.getAttribute('href') : 'Не найден';

        return metaTags;
    }

    // Обработчик для кнопки получения мета-тегов
    const tagsButton = document.getElementById('get-tags');
    tagsButton.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: getRelevantTags
            }, (results) => {
                if (results && results[0] && results[0].result) {
                    const tags = results[0].result;

                    document.getElementById('meta-title').textContent = tags.title || 'Нет данных';
                    document.getElementById('meta-h1').textContent = tags.h1 || 'Нет данных';
                    document.getElementById('meta-description').textContent = tags.description || 'Нет данных';
                    document.getElementById('meta-robots').textContent = tags.robots || 'Нет данных';
                    document.getElementById('meta-keywords').textContent = tags.keywords || 'Нет данных';
                    document.getElementById('meta-locale').textContent = tags.locale || 'Нет данных';
                    document.getElementById('meta-url').textContent = tags.url || 'Нет данных';
                    document.getElementById('meta-apple-mobile-web-app-capable').textContent = tags['apple-mobile-web-app-capable'] || 'Нет данных';
                    document.getElementById('meta-sitemap').textContent = tags.sitemap || 'Нет данных';
                } else {
                    console.error('Ошибка: Не удалось получить данные.');
                }
            });
        });
    });

    // Функция для определения фреймворков
    function detectFrameworksAndMetrics() {
        const result = {
            frameworks: {},
            metrics: {}
        };
    
        const frameworkSignatures = {
            "React": ["React.createElement", "ReactDOM.render", "useEffect", "useState", "componentDidMount"],
            "Vue.js": ["Vue.component", "new Vue({ el:", "v-bind:", "v-model", "v-for"],
            "Angular": ["angular.module", "@Component", "ng-if", "ng-repeat", "ng-model"],
            "jQuery": ["$(document).ready", ".on('click'", ".ajax", "$.get", "$.post"],
            "Svelte": ["new Svelte", "svelte:component", "on:click", "import { onMount }"],
            "Ember.js": ["Ember.Component", "this.set", "Ember.Route", "Ember.Object"],
            "Next.js": ["getStaticProps", "getServerSideProps", "NextResponse.redirect", "Link", "Image"],
            "Nuxt.js": ["asyncData", "fetch", "nuxt.config.js", "this.$axios", "middleware"],
            "Backbone.js": ["new Backbone.View", "Backbone.Model", "Backbone.Collection", "Backbone.Router", "initialize"],
            "Bootstrap": ["$('.modal').modal()", "data-toggle", "btn", ".collapse", "alert"]
        };
        
        const cmsSignatures = {
            "WordPress": ["wp-content/", "wp-", "wordpress", "wp_insert_post", "add_action", "get_template_part"],
            "Joomla": ["/administrator/index.php", "Joomla!", "com_content", "JFactory::getApplication", "JLoader::import"],
            "Drupal": ["Drupal.settings", "drupal-", "Drupal.behaviors", "hook_menu", "drupal_get_form"],
            "Bitrix": ["/bitrix/", "bitrix_", "BX.ready", "CModule::IncludeModule", "CUser::GetByID"],
            "Magento": ["Magento\\Framework", "app/code", "Block", "Models", "setup"],
            "TYPO3": ["TYPO3\\CMS", "ext_localconf.php", "TYPO3_CONF_VARS"],
            "Shopify": ["ShopifyAPI", "theme.liquid", "script_tag", "{% if ", "{% for "],
            "Concrete5": ["Concrete\Core", "Page::getByID", "Block::getByID", "view.php", "Package::getInstalled"],
            "SilverStripe": ["SilverStripe\\core", "DataObject::get", "leftJoin", "$this->getName()"],
            "Wix": ["$w", "import wixData", "wixLocation", "wixUsers"]
        };
        
        const backendSignatures = {
            "PHP": ["<?php", "?>", ".php", "echo", "require_once"],
            "Python (Django)": ["django.contrib", "from django.db import models", "views.py", "urls.py", "admin.site.register"],
            "Node.js (Express)": ["const express = require('express')", "app.get('/', (req, res) =>", "app.listen", "req.params", "middleware"],
            "Ruby on Rails": ["Rails.application", "render", "ActiveRecord", "routes.rb", "before_action"],
            "Java (Spring)": ["@SpringBootApplication", "public static void main", "@Bean", "RequestMapping", "RestController"],
            "Go (Gin)": ["func main()", "router := gin.Default()", "r.GET", "c.JSON", "c.BindJSON"],
            "C# (.NET Core)": ["public class Startup", "app.UseRouting()", "IServiceCollection", "app.UseEndpoints", "controller"],
            "Rust (Rocket)": ["#[get('/')]", "fn main()", "launch()", "rocket::ignite()", "routes!"],
            "Elixir (Phoenix)": ["defmodule MyAppWeb.Router", "get \"/\"", "controller", "action", "render conn"],
            "Scala (Play Framework)": ["def index() = Action {", "Ok(views.html.index())", "implicit val ec", "Json.toJson", "routes"],
            "Laravel (PHP)": ["use Illuminate\\Support\\Facades\\Route;", "Route::get('/', function ()", "namespace App\\Http\\Controllers;", "public function index()", "return view('welcome');"]

        };
    
        const metricSignatures = {
            "Яндекс.Метрика": ["<!-- Yandex.Metrika counter -->", "ym(12345678, 'init'", "ym(12345678, 'reachGoal'", "ym(12345678, 'hit'"],
            "Google Analytics": ["<!-- Google Analytics -->", "ga('create', 'UA-", "ga('send', 'pageview'", "gtag('config'", "gtag('event'"],
            "VK Метрика": ["<!-- VK Analytics -->", "window._vkq.push", "window.vk && vk('init'", "_vkq.push(['event'", "_vkq.push(['tag'"],
            "Facebook Pixel": ["<!-- Facebook Pixel Code -->", "fbq('init'", "fbq('track'", "fbq('trackCustom'"],
            "Hotjar": ["<!-- Hotjar Tracking Code -->", "hjs('trigger'", "hjs('identify'", "hjs('track"],
            "Mixpanel": ["<!-- Mixpanel -->", "mixpanel.init", "mixpanel.track", "mixpanel.people.set"],
            "Piwik/Matomo": ["<!-- Matomo -->", "var _paq = window._paq || []", "_paq.push(['trackPageView']", "_paq.push(['enableLinkTracking'"],
            "Clicky": ["<!-- Clicky -->", "var clicky_site_ids = ['", "_clicky.push(['trackPageview'", "_clicky.push(['setCustom"],
            "Segment": ["<!-- Segment -->", "analytics.load", "analytics.page", "analytics.track"]
        };
        
        // Проверка CMS
        for (const [cms, signatures] of Object.entries(cmsSignatures)) {
            if (signatures.some(sig => document.documentElement.innerHTML.includes(sig))) {
                result.frameworks.cms = cms;
                break;
            }
        }
    
        // Проверка JS фреймворков
        for (const [framework, signatures] of Object.entries(frameworkSignatures)) {
            if (signatures.some(sig => document.documentElement.innerHTML.includes(sig))) {
                result.frameworks.jsFramework = framework;
                break;
            }
        }
    
        // Проверка серверных фреймворков
        for (const [backendFramework, signatures] of Object.entries(backendSignatures)) {
            if (signatures.some(sig => document.documentElement.innerHTML.includes(sig))) {
                result.frameworks.backendFramework = backendFramework;
                break;
            }
        }
    
        // Проверка метрик
        for (const [metric, signatures] of Object.entries(metricSignatures)) {
            if (signatures.some(sig => document.documentElement.innerHTML.includes(sig))) {
                result.metrics[metric] = true;
            }
        }
    
        return JSON.stringify(result);
    }
    
    // Обработчик для кнопки получения фреймворков и метрик
    const frameworksButton = document.getElementById('get-frameworks');
    frameworksButton.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: detectFrameworksAndMetrics
            }, (results) => {
                if (results && results[0] && results[0].result) {
                    const data = JSON.parse(results[0].result);
                    document.getElementById('cms').textContent = data.frameworks.cms || 'Не найдено';
                    document.getElementById('js-framework').textContent = data.frameworks.jsFramework || 'Не найдено';
                    document.getElementById('backend-framework').textContent = data.frameworks.backendFramework || 'Не найдено';
    
                    // Обновляем метрики
                    const metricsList = Object.keys(data.metrics);
                    document.getElementById('metrics').textContent = metricsList.length > 0 ? metricsList.join(', ') : 'Не найдены';
                } else {
                    console.error("Ошибка при получении данных о фреймворках и метриках");
                }
            });
        });
    });

    // Обработчик для кнопки экспорта данных в Excel
    document.getElementById('export-excel').addEventListener('click', function () {
        const data = {
            meta: {
                title: document.getElementById('meta-title').textContent,
                h1: document.getElementById('meta-h1').textContent,
                description: document.getElementById('meta-description').textContent,
                robots: document.getElementById('meta-robots').textContent,
                keywords: document.getElementById('meta-keywords').textContent,
                locale: document.getElementById('meta-locale').textContent,
                url: document.getElementById('meta-url').textContent,
                appleCapable: document.getElementById('meta-apple-mobile-web-app-capable').textContent,
                sitemap: document.getElementById('meta-sitemap').textContent
            },
            frameworks: {
                cms: document.getElementById('cms').textContent,
                jsFramework: document.getElementById('js-framework').textContent,
                backendFramework: document.getElementById('backend-framework').textContent,
                metrics: document.getElementById('metrics').textContent
            }
        };

        exportToExcel(data);
    });

    function exportToExcel(data) {
        const wb = XLSX.utils.book_new();

        const metaData = [
            ["Title", data.meta.title],
            ["H1", data.meta.h1],
            ["Description", data.meta.description],
            ["Robots", data.meta.robots],
            ["Keywords", data.meta.keywords],
            ["Locale", data.meta.locale],
            ["URL", data.meta.url],
            ["Apple Mobile Web App Capable", data.meta.appleCapable],
            ["Sitemap", data.meta.sitemap]
        ];
        const metaSheet = XLSX.utils.aoa_to_sheet(metaData);
        XLSX.utils.book_append_sheet(wb, metaSheet, 'Meta Data');

        const frameworkData = [
            ["CMS", data.frameworks.cms],
            ["JavaScript Framework", data.frameworks.jsFramework],
            ["Backend Framework", data.frameworks.backendFramework]
            ["Backend Framework", data.frameworks.backendFramework]
        ];
        const frameworkSheet = XLSX.utils.aoa_to_sheet(frameworkData);
        XLSX.utils.book_append_sheet(wb, frameworkSheet, 'Frameworks');

        XLSX.writeFile(wb, 'Website_Data.xlsx');
    }
/////////////
function loadServices() {
    const services = JSON.parse(localStorage.getItem('userServices')) || [];
    const userServicesDiv = document.getElementById('user-services');
    
    userServicesDiv.innerHTML = '';
    services.forEach(service => {
        const button = document.createElement('a');
        button.href = service.url;
        button.target = "_blank";
        button.className = "btn btn-light service-button";
        button.textContent = service.name;
        userServicesDiv.appendChild(button);
    });
}

// Функция для добавления пользовательского сервиса
document.getElementById('add-service').addEventListener('click', function() {
    const url = document.getElementById('service-url').value;
    const name = document.getElementById('service-name').value;
    
    if (url && name) {
        const services = JSON.parse(localStorage.getItem('userServices')) || [];
        services.push({ url, name });
        localStorage.setItem('userServices', JSON.stringify(services));
        loadServices();
        document.getElementById('service-url').value = '';
        document.getElementById('service-name').value = '';
    } else {
        alert('Пожалуйста, заполните оба поля.');
    }
});

// Загружаем пользовательские сервисы при загрузке страницы
window.onload = loadServices;
});


