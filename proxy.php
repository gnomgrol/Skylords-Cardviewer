<?php
$url = trim($_GET["url"]);
echo file_get_contents($url);
?>