<?php
header('Content-encoding: gzip');

$path = "./puzzles/";
$files = array_slice(scandir($path), 2);
$n = array_rand($files);
$data = file_get_contents($path.$files[$n]);

echo $data;
?>
